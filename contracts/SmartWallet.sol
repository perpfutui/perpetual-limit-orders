//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import "./LimitOrderBook.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "hardhat/console.sol";

import { Decimal } from "./utils/Decimal.sol";
import { SignedDecimal } from "./utils/SignedDecimal.sol";

import { IAmm } from "./interface/IAmm.sol";
import { IClearingHouse } from "./interface/IClearingHouse.sol";

contract SmartWallet is Ownable {

  // Store addresses of smart contracts that we will be interacting with
  // @audit recommendation: naming convention, we usually use ALL CAPITAL for constant, but others are not.
  LimitOrderBook public LOB;
  SmartWalletFactory public factory;
  address constant USDC = 0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83;
  address constant ClearingHouse = 0x5d9593586b4B5edBd23E7Eba8d88FD8F09D83EBd;

  using Decimal for Decimal.decimal;
  using SignedDecimal for SignedDecimal.signedDecimal;
  using Address for address;
  using SafeERC20 for IERC20;

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
  // @audit it's too danger without any limitations. If attacker changes the `target` or `callData`, 
  // users are hard to regconize what happen. For example, if `target` is `this` and `callData`
  // is OPCODE of `selfdestruct`, this contract will be destroyed and user may loss their fund.
  // suggest that 
  // 1. have a whitelisting for `target`, only `target` in the whitelisting can be executed
  // 2. have an allow-list(like EIP-165) for `callData`, only allowed functions can be executed

  function executeCall(
    address target,
    bytes calldata callData
  ) external onlyOwner() returns (bytes memory) {
    require(target.isContract(), 'call to non-contract');
    //require(factory.isWhitelisted(target), 'Invalid target contract');
    return target.functionCall(callData);
  }

  //Initialisation function to set LOB
  // @audit recommendation: can use constructor to init `LOB` or invoke factory.LimitOrderBook()
  function setOrderBook(
    address _addr
  ) public {
    require(address(LOB) == address(0), 'LOB has already been set');
    LOB = LimitOrderBook(_addr);
  }

  //Initialisation function to set factory
  // @audit recommendation: can use constructor to init `factory`
  // @audit use external visibility instead if no other functions call it
  function setFactory(
    SmartWalletFactory _addr
  ) public {
    require(address(factory) == address(0), 'SWF has already been set');
    factory = SmartWalletFactory(_addr);
  }

// @audit use external visibility instead if no other functions call it
  function executeMarketOrder(
    IAmm _asset,
    SignedDecimal.signedDecimal memory _orderSize,
    Decimal.decimal memory _collateral,
    Decimal.decimal memory _leverage,
    Decimal.decimal memory _slippage
  ) public onlyOwner(){
    _handleOpenPositionWithApproval(_asset, _orderSize, _collateral, _leverage, _slippage);
  }

// @audit use external visibility instead if no other functions call it
  function executeClosePosition(
    IAmm _asset,
    Decimal.decimal memory _slippage
  ) public onlyOwner() {
    _handleClosePositionWithApproval(_asset, _slippage);
  }

  /*
   * @notice Will execute an order from the limit order book. Note that the only
   *  way to call this function is via the LimitOrderBook where you call execute().
   * @param order_id is the ID of the order to execute
   */
   // @audit use external visibility instead if no other functions call it
  function executeOrder(
    uint order_id
  ) public returns (bool) {
    //Only the LimitOrderBook can call this function
    require(msg.sender == address(LOB), 'Only execute from the order book');
    //Get some of the parameters
    (,address _trader,
      LimitOrderBook.OrderType _orderType,
      ,bool _stillValid, uint _expiry) =
      LOB.getLimitOrderParams(order_id);
    //Make sure that the order belongs to this smart wallet
    // TODO: find another way to check this
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
    // @audit if this function tries to get the minimum value, should be `a.cmp(b) >= 1 ? b : a`
    return (a.cmp(b) == 1) ? b : a;
  }

  function _handleOpenPositionWithApproval(
    IAmm _asset,
    SignedDecimal.signedDecimal memory _orderSize,
    Decimal.decimal memory _collateral,
    Decimal.decimal memory _leverage,
    Decimal.decimal memory _slippage
  ) internal {
    // @audit logs should remove before launch
    console.log('OPEN POSITION');
    console.log('ORDER SIZE', _orderSize.abs().toUint());
    console.log('SLIPPAGEEE', _slippage.toUint());
    console.log('---');

    //Get cost of placing order (fees)
    (Decimal.decimal memory toll, Decimal.decimal memory spread) = _asset
      .calcFee(_collateral.mulD(_leverage));
    Decimal.decimal memory totalCost = _collateral.addD(toll).addD(spread);
    // @audit it's safer to have a decimal conversion function to handle this and use SafeMath
    IERC20(USDC).safeIncreaseAllowance(ClearingHouse,(totalCost.toUint()/(10**12)));

    //Establish how much leverage will be needed for that order based on the
    //amount of collateral and the maximum leverage the user was happy with.
    bool _isLong = _orderSize.isNegative() ? false : true;

    Decimal.decimal memory _size = _orderSize.abs();
    Decimal.decimal memory _quote = (IAmm(_asset)
      .getOutputPrice(_isLong ? IAmm.Dir.REMOVE_FROM_AMM : IAmm.Dir.ADD_TO_AMM, _size));
    Decimal.decimal memory _offset = Decimal.decimal(1); //Need to add one wei for rounding
    _leverage = minD(_quote.divD(_collateral).addD(_offset),_leverage);

    IClearingHouse(ClearingHouse).openPosition(
      _asset,
      _isLong ? IClearingHouse.Side.BUY : IClearingHouse.Side.SELL,
      _collateral,
      _leverage,
      _slippage
      );
  }

  function _calcBaseAssetAmountLimit(
    Decimal.decimal memory _positionSize,
    bool _isLong,
    Decimal.decimal memory _slippage
  ) internal pure returns (Decimal.decimal memory){
    Decimal.decimal memory factor;
    require(_slippage.cmp(Decimal.one()) == -1, 'Slippage must be %');
    if (_isLong) {
      //base amount must be greater than base amount limit
      factor = Decimal.one().subD(_slippage);
    } else {
      //base amount must be less than base amount limit
      factor = Decimal.one().addD(_slippage);
    }
    return factor.mulD(_positionSize);
  }

  /*

    OPEN LONG
    BASE ASSET LIMIT = POSITION SIZE - SLIPPAGE

    OPEN SHORT
    BASE ASSET LIMIT = POSITION SIZE + SLIPPAGE

    CLOSE LONG
    QUOTE ASSET LIMIT = VALUE - SLIPPAGE

    CLOSE SHORT
    QUOTE ASSET LIMIT = VALUE + SLIPPAGE

  */

  function _calcQuoteAssetAmountLimit(
    Decimal.decimal memory _positionValue,
    bool _isLong,
    Decimal.decimal memory _slippage
  ) internal pure returns (Decimal.decimal memory){
    Decimal.decimal memory factor;
    require(_slippage.cmp(Decimal.one()) == -1, 'Slippage must be %');
    if (_isLong) {
      //quote amount must be less than quote amount limit
      factor = Decimal.one().subD(_slippage);
    } else {
      //quote amount must be greater than quote amount limit
      factor = Decimal.one().addD(_slippage);
    }
    return factor.mulD(_positionValue);
  }

  function _handleClosePositionWithApproval(
    IAmm _asset,
    Decimal.decimal memory _slippage
  ) internal {
    console.log('CLOSE POSITION');
    console.log('SLIPPAGE', _slippage.toUint());
    console.log('---');
    //Need to calculate trading fees to close position (no margin required)
    IClearingHouse.Position memory oldPosition = IClearingHouse(ClearingHouse)
      .getUnadjustedPosition(_asset, address(this));
    SignedDecimal.signedDecimal memory oldPositionSize = oldPosition.size;
    Decimal.decimal memory _quoteAsset = _asset.getOutputPrice(
      oldPositionSize.toInt() > 0 ? IAmm.Dir.ADD_TO_AMM : IAmm.Dir.REMOVE_FROM_AMM,
      oldPositionSize.abs()
      );
    (Decimal.decimal memory toll, Decimal.decimal memory spread) = _asset
      .calcFee(_quoteAsset);
    Decimal.decimal memory totalCost = toll.addD(spread);
    // @audit it's safer to have a decimal conversion function to handle this and use SafeMath
    IERC20(USDC).safeIncreaseAllowance(ClearingHouse,(totalCost.toUint()/(10**12)));

    IClearingHouse(ClearingHouse).closePosition(
      _asset,
      _slippage
      );
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
    } else {
      //User is trying to increase the size of their position
      revert('#reduceOnly: cannot increase size of position');
    }
  }

  //  @audit recommendation, 
  // `_executeXXX` series functions have the same pre condition check, can merge into a checking function 
  // and return necessary values for later usage to reduce redunant code.
  // even more, have a function to determine `priceCheck` in different situations and 
  // the code are highly similiar after price check, might be possible to merge into 
  // `_handleOpenPositionWithApproval` and `_handleClosePositionWithApproval`
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
      // @audit only see two use cases, one is in `executeOrder` the others are in `_executeXXX` functions.
      // suggest to move `_asset` and `_reduceOnly` to `getLimitOrderPrices` to reduce external function call
      // for gas saving.
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
      if(closePosition) {
        // @audit sorry for being confusing, should use `getPosition()`
        IClearingHouse.Position memory oldPosition = IClearingHouse(ClearingHouse)
          .getUnadjustedPosition(IAmm(_asset), address(this));
        SignedDecimal.signedDecimal memory oldPositionSize = oldPosition.size;
        Decimal.decimal memory value = oldPositionSize.abs().mulD(_limitPrice);
        Decimal.decimal memory quoteAssetLimit = _calcQuoteAssetAmountLimit(
          value,
          isLong,
          _slippage);
        _handleClosePositionWithApproval(
          IAmm(_asset),
          quoteAssetLimit
          );
      } else {
        //openPosition using the values calculated above
        Decimal.decimal memory baseAssetLimit = _calcBaseAssetAmountLimit(_orderSize.abs(), isLong, _slippage);
        _handleOpenPositionWithApproval(
          IAmm(_asset),
          _orderSize,
          _collateral,
          _leverage,
          baseAssetLimit
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
      if(closePosition) {
        //Strictly speaking, stop orders cannot have slippage as by definition they
        //will get executed at the next available price. Restricting them with slippage
        //will turn them into stop limit orders.
        _handleClosePositionWithApproval(
          IAmm(_asset),
          Decimal.decimal(0)
          );
      } else {
        //Strictly speaking, stop orders cannot have slippage as by definition they
        //will get executed at the next available price. Restricting them with slippage
        //will turn them into stop limit orders.
        _handleOpenPositionWithApproval(
          IAmm(_asset),
          _orderSize,
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
      if(closePosition) {
        IClearingHouse.Position memory oldPosition = IClearingHouse(ClearingHouse)
          .getUnadjustedPosition(IAmm(_asset), address(this));
        SignedDecimal.signedDecimal memory oldPositionSize = oldPosition.size;
        Decimal.decimal memory value = oldPositionSize.abs().mulD(_limitPrice);
        Decimal.decimal memory quoteAssetLimit = _calcQuoteAssetAmountLimit(
          value,
          isLong,
          _slippage);
        _handleClosePositionWithApproval(
          IAmm(_asset),
          quoteAssetLimit
          );
      } else {
        //openPosition using the values calculated above
        Decimal.decimal memory baseAssetLimit = _calcBaseAssetAmountLimit(_orderSize.abs(), isLong, _slippage);
        _handleOpenPositionWithApproval(
          IAmm(_asset),
          _orderSize,
          _collateral,
          _leverage,
          baseAssetLimit
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
  // @audit better to use an interface to repersent smartWallet, 
  // it'll be easier for coding and finding error at compiling time
  // For example, `SmartWallet(smartWallet).setFactory(this);` can be `smartWallet.setFactory(this);`
  mapping (address => address) public getSmartWallet;

  address public LimitOrderBook;

  constructor(address _addr) public {
    LimitOrderBook = _addr;
  }

  /*
   * @notice Create and deploy a smart wallet for the user and stores the address
   */
  //  @audit no one calls this function, can make the visibility to `external`
  function spawn() public returns (address smartWallet) {
    require(getSmartWallet[msg.sender] == address(0), 'Already has smart wallet');

    bytes memory bytecode = type(SmartWallet).creationCode;
    // @audit suggest to have an parameter input frome the user or block number as part of salt
    // in case that the user needs to have another smartWallet 
    bytes32 salt = keccak256(abi.encodePacked(msg.sender));
    assembly {
      smartWallet := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
    }

    // @audit the type of smartWallet is address, no needs to convert it again.
    emit Created(msg.sender, address(smartWallet));
    SmartWallet(smartWallet).setOrderBook(LimitOrderBook);
    SmartWallet(smartWallet).setFactory(this);
    SmartWallet(smartWallet).transferOwnership(msg.sender);
    getSmartWallet[msg.sender] = smartWallet;
  }

}
