pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./LimitOrderBook.sol";
import { Decimal } from "./utils/Decimal.sol";
import { SignedDecimal } from "./utils/SignedDecimal.sol";
import { IAmm } from "./interface/IAmm.sol";

interface IClearingHouse {
    enum Side { BUY, SELL }
    function openPosition(
        IAmm _amm,
        Side _side,
        Decimal.decimal calldata _quoteAssetAmount,
        Decimal.decimal calldata _leverage,
        Decimal.decimal calldata _baseAssetAmountLimit
    ) external;
}

contract SmartWallet is Ownable {

  LimitOrderBook LOB;
  SmartWalletFactory factory;
  address constant USDC = 0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83;
  address constant ClearingHouse = 0x5d9593586b4B5edBd23E7Eba8d88FD8F09D83EBd;

  using Decimal for Decimal.decimal;
  using SignedDecimal for SignedDecimal.signedDecimal;

  function approveAll() public {
    IERC20(USDC).approve(ClearingHouse, type(uint256).max);
  }

  //Taken from https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Address.sol
  function isContract(address account) internal view returns (bool) {
      // This method relies on extcodesize, which returns 0 for contracts in
      // construction, since the code is only stored at the end of the
      // constructor execution.

      uint256 size;
      // solhint-disable-next-line no-inline-assembly
      assembly { size := extcodesize(account) }
      return size > 0;
  }

  function executeCall(
    address target,
    bytes calldata callData
  ) external onlyOwner() returns (bytes memory) {
    require(isContract(target), 'call to non-contract');
    (bool success, bytes memory result) = target.call(callData);
    if (success == false) {
      assembly {
        let ptr := mload(0x40)
        let size := returndatasize()
        returndatacopy(ptr, 0, size)
        revert(ptr, size)
      }
    }
    return result;
  }

  function setOrderBook(
    address _addr
  ) public {
    require(address(LOB) == address(0), 'LOB has already been set');
    LOB = LimitOrderBook(_addr);
  }

  function setFactory(
    SmartWalletFactory _addr
  ) public {
    require(address(factory) == address(0), 'SWF has already been set');
    factory = SmartWalletFactory(_addr);
  }


  function executeOrder(
    uint order_id
  ) public returns (bool) {
    require(msg.sender == address(LOB), 'Only execute from the order book');
    console.log('--SW: Order #', order_id);
    // DO ALL THE NECESSARY CHEKS
    // INTERACT WITH CLEARING HOUSE
    // ????
    // PROFIT
    (, address _trader,
      LimitOrderBook.OrderType _orderType,
      ,bool _stillValid, uint _expiry) =
      LOB.getLimitOrderParams(order_id);
    require(factory.getSmartWallet(_trader) == address(this), 'Incorrect smart wallet');
    require(((_expiry == 0 ) || (block.timestamp<_expiry)), 'Order expired');
    require(_stillValid, 'Order no longer valid');
    if(_orderType == LimitOrderBook.OrderType.LIMIT) {
      return _executeLimitOrder(order_id);
    }
    return false;
  }

  function minD(Decimal.decimal memory a, Decimal.decimal memory b) public pure
  returns (Decimal.decimal memory){
    return (a.cmp(b) == 1) ? b : a;
  }

  function _executeLimitOrder(
    uint order_id
  ) internal returns (bool) {
    (Decimal.decimal memory _limitPrice,,
      SignedDecimal.signedDecimal memory _positionSize,
      Decimal.decimal memory _collateral,
      Decimal.decimal memory _leverage,
      Decimal.decimal memory _slippage,) = LOB.getLimitOrderPrices(order_id);
    (address _asset,,,bool _reduceOnly,,) = LOB.getLimitOrderParams(order_id);
    bool isLong = !_positionSize.isNegative();
    //Decimal.decimal memory _markPrice = Decimal.decimal(44000000000000000000000);
    Decimal.decimal memory _markPrice = IAmm(_asset).getSpotPrice();
    bool priceCheck = (_limitPrice.cmp(_markPrice)) == (isLong ? int128(1) : -1);
    if(priceCheck) {
      Decimal.decimal memory _size = _positionSize.abs();
      //Decimal.decimal memory _quote = Decimal.decimal(44000000000000000000000).mulD(_positionSize.abs());
      Decimal.decimal memory _quote = (IAmm(_asset).getOutputPrice(isLong ? IAmm.Dir.REMOVE_FROM_AMM : IAmm.Dir.ADD_TO_AMM, _size));
      _slippage = (_slippage.toUint()==0) ? _slippage : _slippage.subD(Decimal.decimal(1));
      _leverage = minD(_quote.divD(_collateral),_leverage);
      IClearingHouse(ClearingHouse).openPosition(
        IAmm(_asset),
        isLong ? IClearingHouse.Side.BUY : IClearingHouse.Side.SELL,
        _collateral,
        _leverage, //or max leverage
        _slippage
        );
    } else {
      return false;
    }
    return true;
  }

}//OUTPUT:
/*
----,0
----,30000000000000000  0.03 (collateral)
----,852445086472433    0.000852445086472433 (leverage)
----,1000000000000000   0.001 (position size)

//1000000000000 -> LIMIT? (position size as per contract)
//1000000 -> BASE AMOUNT- (as per trade)

----,30000000000000000 collat 0.03
----,858126332586130133 lev 0.85
----,1000000000000000 size 0.001

SwapInput(
0,
25743789977583903, quote asset
1000000000000000 base asset limit

0xC611734aa12d4c940bdDAC7CF395842Cb8B38AB8
,
0x5d9593586b4B5edBd23E7Eba8d88FD8F09D83EBd
,30000

)

*/
contract SmartWalletFactory {
  event Created(address indexed owner, address indexed smartWallet);
  mapping (address => address) public getSmartWallet;

  address public LimitOrderBook;

  constructor(address _addr) public {
    LimitOrderBook = _addr;
  }

  function spawn() public returns (address smartWallet) {
    require(getSmartWallet[msg.sender] == address(0), 'Already has smart wallet');

    bytes memory bytecode = type(SmartWallet).creationCode;
    bytes32 salt = keccak256(abi.encodePacked(msg.sender));
    assembly {
      smartWallet := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
    }

    emit Created(msg.sender, address(smartWallet));
    SmartWallet(smartWallet).approveAll();
    SmartWallet(smartWallet).transferOwnership(msg.sender);
    SmartWallet(smartWallet).setOrderBook(LimitOrderBook);
    SmartWallet(smartWallet).setFactory(this);
    getSmartWallet[msg.sender] = smartWallet;
  }

}
