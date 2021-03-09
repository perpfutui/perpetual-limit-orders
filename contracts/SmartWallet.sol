//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import "./LimitOrderBook.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import { Decimal } from "./utils/Decimal.sol";
import { SignedDecimal } from "./utils/SignedDecimal.sol";

import { IAmm } from "./interface/IAmm.sol";
import { IClearingHouse } from "./interface/IClearingHouse.sol";

contract SmartWallet is Ownable {

  // Store addresses of smart contracts that we will be interacting with
  LimitOrderBook public LOB;
  SmartWalletFactory public factory;
  address constant USDC = 0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83;
  address constant ClearingHouse = 0x5d9593586b4B5edBd23E7Eba8d88FD8F09D83EBd;

  using Decimal for Decimal.decimal;
  using SignedDecimal for SignedDecimal.signedDecimal;
  using Address for address;

  //Allow the limit order book and clearing house contracts access to spend the
  //USDC on this smart wallet
  function approveAll() public {
    IERC20(USDC).approve(ClearingHouse, type(uint256).max);
    IERC20(USDC).approve(address(LOB), type(uint256).max);
  }

  /*
   * @notice allows the owner of the smart wallet to execute any transaction
   *  on an external smart contract. There are no restrictions on the contracts
   *  that the user can interact with so needs to make sure that they do not
   *  interact with any malicious contracts.
   *  This utilises functions from OpenZeppelin's Address.sol
   * @param target the address of the smart contract to interact with (will revert
   *    if this is not a valid smart contract)
   * @param callData the data bytes of the function and parameters to execute
   *    Can use encodeFunctionData() from ethers.js
   */
  function executeCall(
    address target,
    bytes calldata callData
  ) external onlyOwner() returns (bytes memory) {
    require(target.isContract(), 'call to non-contract');
    //require(factory.isWhitelisted(target), 'Invalid target contract');
    return target.functionCall(callData);
  }

  //Initialisation function to set LOB
  function setOrderBook(
    address _addr
  ) public {
    require(address(LOB) == address(0), 'LOB has already been set');
    LOB = LimitOrderBook(_addr);
  }

  //Initialisation function to set factory
  function setFactory(
    SmartWalletFactory _addr
  ) public {
    require(address(factory) == address(0), 'SWF has already been set');
    factory = SmartWalletFactory(_addr);
  }

  /*
   * @notice Will execute an order from the limit order book. Note that the only
   *  way to call this function is via the LimitOrderBook where you call execute().
   * @param order_id is the ID of the order to execute
   */
  function executeOrder(
    uint order_id
  ) public returns (bool) {
    //Only the LimitOrderBook can call this function
    require(msg.sender == address(LOB), 'Only execute from the order book');
    //Get some of the parameters
    (, address _trader,
      LimitOrderBook.OrderType _orderType,
      ,bool _stillValid, uint _expiry) =
      LOB.getLimitOrderParams(order_id);
    //Make sure that the order belongs to this smart wallet
    require(factory.getSmartWallet(_trader) == address(this), 'Incorrect smart wallet');
    //Make sure that the order hasn't expired
    require(((_expiry == 0 ) || (block.timestamp<_expiry)), 'Order expired');
    //Make sure the order is still valid
    require(_stillValid, 'Order no longer valid');
    //Perform function depending on the type of order
    if(_orderType == LimitOrderBook.OrderType.LIMIT) {
      return _executeLimitOrder(order_id);
    } else if(_orderType == LimitOrderBook.OrderType.STOPMARKET) {
      return _executeStopOrder(order_id);
    } else if(_orderType == LimitOrderBook.OrderType.STOPLIMIT) {
      return _executeStopLimitOrder(order_id);
    } else if (_orderType == LimitOrderBook.OrderType.TRAILINGSTOPMARKET) {
      return _executeStopOrder(order_id);
    } else if (_orderType == LimitOrderBook.OrderType.TRAILINGSTOPLIMIT) {
      return _executeStopLimitOrder(order_id);
    }
    //If the ordertype isn't valid ??how?? then this will return false
    return false;
  }

  function minD(Decimal.decimal memory a, Decimal.decimal memory b) public pure
  returns (Decimal.decimal memory){
    return (a.cmp(b) == 1) ? b : a;
  }

  /*
   * @notice check what this order should do if it is reduceOnly
   *  To clarify, only reduceOnly orders should call this function:
   *    If it returns true, then the order should close the position rather than
   *    opening one.
   * @param _asset the AMM for the asset
   * @param _orderSize the size of the order (note: negative are SELL/SHORt)
   */
  function _shouldCloseReduceOnly(
    IAmm _asset,
    SignedDecimal.signedDecimal memory _orderSize
  ) internal view returns (bool) {
    //Get the size of the users current position
    IClearingHouse.Position memory _currentPosition = IClearingHouse(ClearingHouse)
      .getPosition(IAmm(_asset), address(this));
    SignedDecimal.signedDecimal memory _currentSize = _currentPosition.size;
    //If the user has no position for this asset, then cannot execute a reduceOnly order
    require(_currentSize.abs().toUint() != 0, "#reduceOnly: current size is 0");
    //If the direction of the order is opposite to the users current position
    if(_orderSize.isNegative() != _currentSize.isNegative()) {
      //User is long and wants to sell:
      if(_orderSize.isNegative()) {
        //The size of the order is large enough to open a reverse position,
        //therefore we should close it instead
        if(_orderSize.abs().cmp(_currentSize.abs()) == 1) {
          return true;
        }
      } else {
        //User is short and wants to buy:
        if(_currentSize.abs().cmp(_orderSize.abs()) == 1) {
          //The size of the order is large enough to open a reverse position,
          //therefore we should close it instead
          return true;
        }
      }
      //It shouldn't be possible to make an order of size 0
      if(_orderSize.abs().toUint() == 0) {
        revert('#reduceOnly: orderSize cannot be 0');
      }
    } else {
      //User is trying to increase the size of their position
      revert('#reduceOnly: cannot increase size of position');
    }
  }

  /*
   * @notice internal position to execute limit order - note that you need to
   *  check that this is a limit order before calling this function
   */
  function _executeLimitOrder(
    uint order_id
  ) internal returns (bool) {
    //Get information of limit order
    (,Decimal.decimal memory _limitPrice,
      SignedDecimal.signedDecimal memory _orderSize,
      Decimal.decimal memory _collateral,
      Decimal.decimal memory _leverage,
      Decimal.decimal memory _slippage,) = LOB.getLimitOrderPrices(order_id);
    (address _asset,,,bool _reduceOnly,,) = LOB.getLimitOrderParams(order_id);

    //Check whether we need to close position or open position
    bool closePosition = false;
    if(_reduceOnly) {
      closePosition = _shouldCloseReduceOnly(IAmm(_asset), _orderSize);
    }

    //Establish whether long or short
    bool isLong = _orderSize.isNegative() ? false : true;
    //Get the current spot price of the asset
    Decimal.decimal memory _markPrice = IAmm(_asset).getSpotPrice();
    //Check whether price conditions have been met:
    //  LIMIT BUY: mark price < limit price
    //  LIMIT SELL: mark price > limit price
    bool priceCheck = (_limitPrice.cmp(_markPrice)) == (isLong ? int128(1) : -1);
    if(priceCheck) {
      //Get the size of the order and how much USDC will be needed for that order
      Decimal.decimal memory _size = _orderSize.abs();
      Decimal.decimal memory _quote = (IAmm(_asset)
        .getOutputPrice(isLong ? IAmm.Dir.REMOVE_FROM_AMM : IAmm.Dir.ADD_TO_AMM, _size));
      //Establish how much leverage will be needed for that order based on the
      //amount of collateral and the maximum leverage the user was happy with.
      _leverage = minD(_quote.divD(_collateral).addD(Decimal.one()),_leverage);
      if(closePosition) {
        //Need to update slippage parameter as slippage is minimum amount of BASE ASSET
        //closePosition() takes quoteAssetAmountLimit.
        //Therefore we take the current position size and multiply it by the limit price to
        //establish how much quoteAsset we would expect
        _slippage = _size.mulD(_limitPrice);
        _slippage = _slippage.subD(Decimal.one());
        IClearingHouse(ClearingHouse).closePosition(
          IAmm(_asset),
          _slippage
          );
      } else {
        //openPosition using the values calculated above
        IClearingHouse(ClearingHouse).openPosition(
          IAmm(_asset),
          isLong ? IClearingHouse.Side.BUY : IClearingHouse.Side.SELL,
          _collateral,
          _leverage,
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
    //Get information of stop order
    (Decimal.decimal memory _stopPrice,,
      SignedDecimal.signedDecimal memory _orderSize,
      Decimal.decimal memory _collateral,
      Decimal.decimal memory _leverage,,) = LOB.getLimitOrderPrices(order_id);
    (address _asset,,,bool _reduceOnly,,) = LOB.getLimitOrderParams(order_id);

    //Check whether we need to close position or open position
    bool closePosition = false;
    if(_reduceOnly) {
      closePosition = _shouldCloseReduceOnly(IAmm(_asset), _orderSize);
    }

    //Establish whether long or short
    bool isLong = _orderSize.isNegative() ? false : true;
    //Get the current spot price of the asset
    Decimal.decimal memory _markPrice = IAmm(_asset).getSpotPrice();
    //Check whether price conditions have been met:
    //  STOP BUY: mark price > stop price
    //  STOP SELL: mark price < stop price
    bool priceCheck = (_markPrice.cmp(_stopPrice)) == (isLong ? int128(1) : -1);
    if(priceCheck) {
      //Get the size of the order and how much USDC will be needed for that order
      Decimal.decimal memory _size = _orderSize.abs();
      Decimal.decimal memory _quote = (IAmm(_asset)
        .getOutputPrice(isLong ? IAmm.Dir.REMOVE_FROM_AMM : IAmm.Dir.ADD_TO_AMM, _size));
      //Establish how much leverage will be needed for that order based on the
      //amount of collateral and the maximum leverage the user was happy with.
      _leverage = minD(_quote.divD(_collateral).addD(Decimal.one()),_leverage);
      if(closePosition) {
        //Strictly speaking, stop orders cannot have slippage as by definition they
        //will get executed at the next available price. Restricting them with slippage
        //will turn them into stop limit orders.
        IClearingHouse(ClearingHouse).closePosition(
          IAmm(_asset),
          Decimal.decimal(0)
          );
      } else {
        //Strictly speaking, stop orders cannot have slippage as by definition they
        //will get executed at the next available price. Restricting them with slippage
        //will turn them into stop limit orders.
        IClearingHouse(ClearingHouse).openPosition(
          IAmm(_asset),
          isLong ? IClearingHouse.Side.BUY : IClearingHouse.Side.SELL,
          _collateral,
          _leverage,
          Decimal.decimal(0)
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
    //Get information of stop limit order
    (Decimal.decimal memory _stopPrice,
      Decimal.decimal memory _limitPrice,
      SignedDecimal.signedDecimal memory _orderSize,
      Decimal.decimal memory _collateral,
      Decimal.decimal memory _leverage,
      Decimal.decimal memory _slippage,) = LOB.getLimitOrderPrices(order_id);
    (address _asset,,,bool _reduceOnly,,) = LOB.getLimitOrderParams(order_id);

    //Check whether we need to close position or open position
    bool closePosition = false;
    if(_reduceOnly) {
      closePosition = _shouldCloseReduceOnly(IAmm(_asset), _orderSize);
    }

    //Establish whether long or short
    bool isLong = _orderSize.isNegative() ? false : true;
    //Get the current spot price of the asset
    Decimal.decimal memory _markPrice = IAmm(_asset).getSpotPrice();
    //Check whether price conditions have been met:
    //  STOP LIMIT BUY: limit price > mark price > stop price
    //  STOP LIMIT SELL: limit price < mark price < stop price
    bool priceCheck = (_limitPrice.cmp(_markPrice)) == (isLong ? int128(1) : -1) &&
      (_markPrice.cmp(_stopPrice)) == (isLong ? int128(1) : -1);
    if(priceCheck) {
      //Get the size of the order and how much USDC will be needed for that order
      Decimal.decimal memory _size = _orderSize.abs();
      Decimal.decimal memory _quote = (IAmm(_asset)
        .getOutputPrice(isLong ? IAmm.Dir.REMOVE_FROM_AMM : IAmm.Dir.ADD_TO_AMM, _size));
      //Establish how much leverage will be needed for that order based on the
      //amount of collateral and the maximum leverage the user was happy with.
      _leverage = minD(_quote.divD(_collateral).addD(Decimal.one()),_leverage);
      if(closePosition) {
        //Need to update slippage parameter as slippage is minimum amount of BASE ASSET
        //closePosition() takes quoteAssetAmountLimit.
        //Therefore we take the current position size and multiply it by the limit price to
        //establish how much quoteAsset we would expect
        _slippage = _size.mulD(_limitPrice);
        _slippage = _slippage.subD(Decimal.one());
        IClearingHouse(ClearingHouse).closePosition(
          IAmm(_asset),
          _slippage
          );
      } else {
        //openPosition using the values calculated above
        IClearingHouse(ClearingHouse).openPosition(
          IAmm(_asset),
          isLong ? IClearingHouse.Side.BUY : IClearingHouse.Side.SELL,
          _collateral,
          _leverage,
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

  /*
   * @notice Create and deploy a smart wallet for the user and stores the address
   */
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
