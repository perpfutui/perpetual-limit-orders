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

    struct Position {
        SignedDecimal.signedDecimal size;
        Decimal.decimal margin;
        Decimal.decimal openNotional;
        SignedDecimal.signedDecimal lastUpdatedCumulativePremiumFraction;
        uint256 liquidityHistoryIndex;
        uint256 blockNumber;
    }

    function openPosition(
        IAmm _amm,
        Side _side,
        Decimal.decimal calldata _quoteAssetAmount,
        Decimal.decimal calldata _leverage,
        Decimal.decimal calldata _baseAssetAmountLimit
    ) external;

    function closePosition(
      IAmm _amm,
      Decimal.decimal calldata _quoteAssetAmountLimit
    ) external;

    function getPosition(IAmm _amm, address _trader) external view returns (Position memory);
}

contract SmartWallet is Ownable {

  LimitOrderBook LOB;
  SmartWalletFactory factory;
  address constant USDC = 0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83;
  address constant ClearingHouse = 0x5d9593586b4B5edBd23E7Eba8d88FD8F09D83EBd;

  using Decimal for Decimal.decimal;
  using SignedDecimal for SignedDecimal.signedDecimal;

  event OpenPosition(address asset, uint256 dir, uint256 collateral, uint256 leverage, uint256 slippage);

  function approveAll() public {
    if(factory.getChainID() == 100) {
      IERC20(USDC).approve(ClearingHouse, type(uint256).max);
      IERC20(USDC).approve(address(LOB), type(uint256).max);
    }
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
    //require(factory.isWhitelisted(target), 'Invalid target contract');
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
    (, address _trader,
      LimitOrderBook.OrderType _orderType,
      ,bool _stillValid, uint _expiry) =
      LOB.getLimitOrderParams(order_id);
    require(factory.getSmartWallet(_trader) == address(this), 'Incorrect smart wallet');
    require(((_expiry == 0 ) || (block.timestamp<_expiry)), 'Order expired');
    require(_stillValid, 'Order no longer valid');
    //TODO: review if these checks are actually required
    if(_orderType == LimitOrderBook.OrderType.LIMIT) {
      return _executeLimitOrder(order_id);
    } else if(_orderType == LimitOrderBook.OrderType.STOPMARKET) {
      return _executeStopOrder(order_id);
    } else if(_orderType == LimitOrderBook.OrderType.STOPLIMIT) {
      return _executeStopLimitOrder(order_id);
    }
    return false;
  }

  function minD(Decimal.decimal memory a, Decimal.decimal memory b) public pure
  returns (Decimal.decimal memory){
    return (a.cmp(b) == 1) ? b : a;
  }

  function _shouldCloseReduceOnly(
    IAmm _asset,
    SignedDecimal.signedDecimal memory _orderSize
  ) internal view returns (bool) {
    IClearingHouse.Position memory _currentPosition = IClearingHouse(ClearingHouse)
      .getPosition(IAmm(_asset), address(this));
    SignedDecimal.signedDecimal memory _currentSize = _currentPosition.size;
    if(_orderSize.isNegative() != _currentSize.isNegative()) {
      if(_orderSize.isNegative()) {
        if(_orderSize.abs().cmp(_currentSize.abs()) == 1) {
          return true;
        }
      } else {
        if(_currentSize.abs().cmp(_orderSize.abs()) == 1) {
          return true;
        }
      }
      if(_orderSize.abs().toUint() == 0) {
        revert('invalid reduceOnly #1');
      }
    } else {
      revert('invalid reduceOnly #2');
    }
  }

  function _executeLimitOrder(
    uint order_id
  ) internal returns (bool) {
    (,Decimal.decimal memory _limitPrice,
      SignedDecimal.signedDecimal memory _orderSize,
      Decimal.decimal memory _collateral,
      Decimal.decimal memory _leverage,
      Decimal.decimal memory _slippage,) = LOB.getLimitOrderPrices(order_id);
    (address _asset,,,bool _reduceOnly,,) = LOB.getLimitOrderParams(order_id);

    bool closePosition = false;
    if(_reduceOnly) {
      closePosition = _shouldCloseReduceOnly(IAmm(_asset), _orderSize);
    }

    bool isLong = _orderSize.isNegative() ? false : true;
    Decimal.decimal memory _markPrice = IAmm(_asset).getSpotPrice();
    bool priceCheck = (_limitPrice.cmp(_markPrice)) == (isLong ? int128(1) : -1);
    if(priceCheck) {
      Decimal.decimal memory _size = _orderSize.abs();
      Decimal.decimal memory _quote = (IAmm(_asset)
        .getOutputPrice(isLong ? IAmm.Dir.REMOVE_FROM_AMM : IAmm.Dir.ADD_TO_AMM, _size));
      _slippage = (_slippage.toUint()==0) ? _slippage :
        ( isLong ? _slippage.subD(Decimal.decimal(1)) : _slippage.addD(Decimal.decimal(1)));
      _leverage = minD(_quote.divD(_collateral),_leverage);
      emit OpenPosition(_asset, isLong ? uint(IClearingHouse.Side.BUY) : uint(IClearingHouse.Side.SELL),
        _collateral.toUint(), _leverage.toUint(), _slippage.toUint());
      if(closePosition) {
        _slippage = _size.mulD(_limitPrice);
        _slippage = _slippage.subD(Decimal.one());
        IClearingHouse(ClearingHouse).closePosition(
          IAmm(_asset),
          _slippage //ensure that this is correct
          );
      } else {
        IClearingHouse(ClearingHouse).openPosition(
          IAmm(_asset),
          isLong ? IClearingHouse.Side.BUY : IClearingHouse.Side.SELL,
          _collateral,
          _leverage, //or max leverage
          _slippage
          );
      }
    } else {
      revert('Price has not hit limit price');
    }
    return true;
  }

  function _executeStopOrder(
    uint order_id
  ) internal returns (bool) {
    (Decimal.decimal memory _stopPrice,,
      SignedDecimal.signedDecimal memory _orderSize,
      Decimal.decimal memory _collateral,
      Decimal.decimal memory _leverage,
      Decimal.decimal memory _slippage,) = LOB.getLimitOrderPrices(order_id);
    (address _asset,,,bool _reduceOnly,,) = LOB.getLimitOrderParams(order_id);

    bool closePosition = false;
    if(_reduceOnly) {
      closePosition = _shouldCloseReduceOnly(IAmm(_asset), _orderSize);
    }

    bool isLong = _orderSize.isNegative() ? false : true;
    Decimal.decimal memory _markPrice = IAmm(_asset).getSpotPrice();
    bool priceCheck = (_markPrice.cmp(_stopPrice)) == (isLong ? int128(1) : -1);
    if(priceCheck) {
      Decimal.decimal memory _size = _orderSize.abs();
      Decimal.decimal memory _quote = (IAmm(_asset)
        .getOutputPrice(isLong ? IAmm.Dir.REMOVE_FROM_AMM : IAmm.Dir.ADD_TO_AMM, _size));
      _slippage = (_slippage.toUint()==0) ? _slippage :
        ( isLong ? _slippage.subD(Decimal.decimal(1)) : _slippage.addD(Decimal.decimal(1)));
      _leverage = minD(_quote.divD(_collateral),_leverage);
      emit OpenPosition(_asset, isLong ? uint(IClearingHouse.Side.BUY) : uint(IClearingHouse.Side.SELL),
        _collateral.toUint(), _leverage.toUint(), _slippage.toUint());
      if(closePosition) {
        IClearingHouse(ClearingHouse).closePosition(
          IAmm(_asset),
          Decimal.decimal(0)
          //we have two options here
          //an alternative method here is to calculate slippage from the TWAP...
          //  Decimal.decimal memory _twap = AMM.getOutputTwap(isLong ? IAmm.Dir.REMOVE_FROM_AMM : IAmm.Dir.ADD_TO_AMM, _size);
          //  _slippage = _twap.mulD(_slippageRatio);
          //cannot have a proper slippage parameter here...
          //calculate slippage from 15 minute TWAP
          );
      } else {
        IClearingHouse(ClearingHouse).openPosition(
          IAmm(_asset),
          isLong ? IClearingHouse.Side.BUY : IClearingHouse.Side.SELL,
          _collateral,
          _leverage, //or max leverage
          Decimal.decimal(0) //the slippage here doesn't actually make sense
          );
      }
    } else {
      revert('Price has not hit stop price');
    }
    return true;
  }

  function _executeStopLimitOrder(
    uint order_id
  ) internal returns (bool) {
    (Decimal.decimal memory _stopPrice,
      Decimal.decimal memory _limitPrice,
      SignedDecimal.signedDecimal memory _orderSize,
      Decimal.decimal memory _collateral,
      Decimal.decimal memory _leverage,
      Decimal.decimal memory _slippage,) = LOB.getLimitOrderPrices(order_id);
    (address _asset,,,bool _reduceOnly,,) = LOB.getLimitOrderParams(order_id);

    bool closePosition = false;
    if(_reduceOnly) {
      closePosition = _shouldCloseReduceOnly(IAmm(_asset), _orderSize);
    }

    bool isLong = _orderSize.isNegative() ? false : true;
    Decimal.decimal memory _markPrice = IAmm(_asset).getSpotPrice();
    bool priceCheck = (_limitPrice.cmp(_markPrice)) == (isLong ? int128(1) : -1) &&
      (_markPrice.cmp(_stopPrice)) == (isLong ? int128(1) : -1);
    if(priceCheck) {
      Decimal.decimal memory _size = _orderSize.abs();
      Decimal.decimal memory _quote = (IAmm(_asset)
        .getOutputPrice(isLong ? IAmm.Dir.REMOVE_FROM_AMM : IAmm.Dir.ADD_TO_AMM, _size));
      _slippage = (_slippage.toUint()==0) ? _slippage :
        ( isLong ? _slippage.subD(Decimal.decimal(1)) : _slippage.addD(Decimal.decimal(1)));
      _leverage = minD(_quote.divD(_collateral),_leverage);
      emit OpenPosition(_asset, isLong ? uint(IClearingHouse.Side.BUY) : uint(IClearingHouse.Side.SELL),
        _collateral.toUint(), _leverage.toUint(), _slippage.toUint());
      if(closePosition) {
        _slippage = _size.mulD(_limitPrice);
        _slippage = _slippage.subD(Decimal.one());
        IClearingHouse(ClearingHouse).closePosition(
          IAmm(_asset),
          _slippage //ensure that this is correct
          );
      } else {
        IClearingHouse(ClearingHouse).openPosition(
          IAmm(_asset),
          isLong ? IClearingHouse.Side.BUY : IClearingHouse.Side.SELL,
          _collateral,
          _leverage, //or max leverage
          _slippage
          );
      }
    } else {
      revert('Price has not hit stoplimit price');
    }
    return true;
  }

}

contract SmartWalletFactory {
  event Created(address indexed owner, address indexed smartWallet);
  mapping (address => address) public getSmartWallet;

  address public LimitOrderBook;

  constructor(address _addr) public {
    LimitOrderBook = _addr;
  }

  function getChainID() public view returns (uint256) {
    uint256 id;
    assembly {
        id := chainid()
    }
    return id;
  }

  function spawn() public returns (address smartWallet) {
    require(getSmartWallet[msg.sender] == address(0), 'Already has smart wallet');

    bytes memory bytecode = type(SmartWallet).creationCode;
    bytes32 salt = keccak256(abi.encodePacked(msg.sender));
    assembly {
      smartWallet := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
    }

    emit Created(msg.sender, address(smartWallet));
    SmartWallet(smartWallet).setOrderBook(LimitOrderBook);
    SmartWallet(smartWallet).setFactory(this);
    SmartWallet(smartWallet).approveAll();
    SmartWallet(smartWallet).transferOwnership(msg.sender);
    getSmartWallet[msg.sender] = smartWallet;
  }

}
