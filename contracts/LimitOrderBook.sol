//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import "./SmartWallet.sol";
import { Decimal } from "./utils/Decimal.sol";
import { SignedDecimal } from "./utils/SignedDecimal.sol";
import { DecimalERC20 } from "./utils/DecimalERC20.sol";
import {IAmm} from "./interface/IAmm.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LimitOrderBook is Ownable, DecimalERC20{

  using Decimal for Decimal.decimal;
  using SignedDecimal for SignedDecimal.signedDecimal;

  /*
   * EVENTS
   */

  event OrderCreated(address indexed trader, uint order_id);
  event OrderFilled(address indexed trader, uint order_id);
  event OrderChanged(address indexed trader, uint order_id);

  event TrailingOrderCreated(uint order_id, uint snapshotIndex);
  event TrailingOrderFilled(uint order_id);

  //Should we store order data with events?

  /*
   * ENUMS
   */

  enum OrderType {
    MARKET,
    LIMIT,
    STOPMARKET,
    STOPLIMIT,
    TRAILINGSTOPMARKET,
    TRAILINGSTOPLIMIT}

  /*
   * STRUCTS
   */

  struct LimitOrder {
    address asset;
    address trader;
    OrderType orderType;
    bool reduceOnly;
    bool stillValid;
    uint256 expiry;
    Decimal.decimal stopPrice;
    Decimal.decimal limitPrice;
    SignedDecimal.signedDecimal orderSize;
    Decimal.decimal collateral;
    Decimal.decimal leverage;
    Decimal.decimal slippage;
    Decimal.decimal tipFee;
  }
  LimitOrder[] public orders;

  struct TrailingOrderData {
    Decimal.decimal witnessPrice;
    Decimal.decimal trail;
    Decimal.decimal trailPct;
    Decimal.decimal gap;
    Decimal.decimal gapPct;
    bool usePct;
    uint256 snapshotCreated;
    uint256 snapshotLastUpdated;
    address lastUpdatedKeeper;
  }
  mapping (uint256 => TrailingOrderData) trailingOrders;

  /*
   * VARIABLES
   */

  SmartWalletFactory public factory;
  address constant USDC = 0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83;
  uint256 constant pokeContractDelay = 15 minutes;
  uint256 constant minimumTipFee = 1000000; // set minimum fee to arbitrary amount determined later

  /*
   * FUNCTIONS TO ADD ORDERS
   */

  function addLimitOrder(
    address _asset,
    Decimal.decimal memory _limitPrice,
    SignedDecimal.signedDecimal memory _positionSize,
    Decimal.decimal memory _collateral,
    Decimal.decimal memory _leverage,
    Decimal.decimal memory _slippage,
    Decimal.decimal memory _tipFee,
    bool _reduceOnly,
    uint256 _expiry
  ) public {
    _createOrder(_asset, OrderType.LIMIT, Decimal.zero(), _limitPrice, _positionSize, _collateral, _leverage, _slippage, _tipFee, _reduceOnly, _expiry)
  }

  function addStopOrder(
    address _asset,
    Decimal.decimal memory _stopPrice,
    SignedDecimal.signedDecimal memory _positionSize,
    Decimal.decimal memory _collateral,
    Decimal.decimal memory _leverage,
    Decimal.decimal memory _slippage,
    Decimal.decimal memory _tipFee,
    bool _reduceOnly,
    uint256 _expiry
  ) public {
    _createOrder(_asset, OrderType.STOPMARKET, _stopPrice, Decimal.zero(), _positionSize, _collateral, _leverage, _slippage, _tipFee, _reduceOnly, _expiry)
  }

  function addStopLimitOrder(
    address _asset,
    Decimal.decimal memory _stopPrice,
    Decimal.decimal memory _limitPrice,
    SignedDecimal.signedDecimal memory _positionSize,
    Decimal.decimal memory _collateral,
    Decimal.decimal memory _leverage,
    Decimal.decimal memory _slippage,
    Decimal.decimal memory _tipFee,
    bool _reduceOnly,
    uint256 _expiry
  ) public {
    _createOrder(_asset, OrderType.STOPLIMIT, _stopPrice, _limitPrice, _positionSize, _collateral, _leverage, _slippage, _tipFee, _reduceOnly, _expiry)
  }

  function addTrailingStopMarketOrderAbs(
    address _asset,
    Decimal.decimal memory _trail,
    SignedDecimal.signedDecimal memory _positionSize,
    Decimal.decimal memory _collateral,
    Decimal.decimal memory _leverage,
    Decimal.decimal memory _slippage,
    Decimal.decimal memory _tipFee,
    bool _reduceOnly,
    uint256 _expiry
  ) public {
    _createOrder(_asset, OrderType.TRAILINGSTOPMARKET, Decimal.zero(), Decimal.zero(),
      _positionSize, _collateral, _leverage, _slippage, _tipFee, _reduceOnly, _expiry)
    _createTrailingOrder(_asset, _trail, Decimal.zero(), false);
  }

  function addTrailingStopMarketOrderPct(
    address _asset,
    Decimal.decimal memory _trailPct,
    SignedDecimal.signedDecimal memory _positionSize,
    Decimal.decimal memory _collateral,
    Decimal.decimal memory _leverage,
    Decimal.decimal memory _slippage,
    Decimal.decimal memory _tipFee,
    bool _reduceOnly,
    uint256 _expiry
  ) public {
    _createOrder(_asset, OrderType.TRAILINGSTOPMARKET, Decimal.zero(), Decimal.zero(),
      _positionSize, _collateral, _leverage, _slippage, _tipFee, _reduceOnly, _expiry)
    _createTrailingOrder(_asset, _trailPct, Decimal.zero(), true);
  }

  function addTrailingStopLimitOrderAbs(
    address _asset,
    Decimal.decimal memory _trail,
    Decimal.decimal memory _gap,
    SignedDecimal.signedDecimal memory _positionSize,
    Decimal.decimal memory _collateral,
    Decimal.decimal memory _leverage,
    Decimal.decimal memory _slippage,
    Decimal.decimal memory _tipFee,
    bool _reduceOnly,
    uint256 _expiry
  ) public{
    _createOrder(_asset, OrderType.TRAILINGSTOPLIMIT, Decimal.zero(), Decimal.zero(),
      _positionSize, _collateral, _leverage, _slippage, _tipFee, _reduceOnly, _expiry)
    _createTrailingOrder(_asset, _trail, _gap, false);
  }

  function addTrailingStopLimitOrderPct(
    address _asset,
    Decimal.decimal memory _trailPct,
    Decimal.decimal memory _gapPct,
    SignedDecimal.signedDecimal memory _positionSize,
    Decimal.decimal memory _collateral,
    Decimal.decimal memory _leverage,
    Decimal.decimal memory _slippage,
    Decimal.decimal memory _tipFee,
    bool _reduceOnly,
    uint256 _expiry
  ) public {
    _createOrder(_asset, OrderType.TRAILINGSTOPLIMIT, Decimal.zero(), Decimal.zero(),
      _positionSize, _collateral, _leverage, _slippage, _tipFee, _reduceOnly, _expiry)
    _createTrailingOrder(_asset, _trailPct, _gapPct, true);
  }

  function _createOrder(
    address _asset,
    OrderType _orderType,
    Decimal.decimal memory _stopPrice,
    Decimal.decimal memory _limitPrice,
    SignedDecimal.signedDecimal memory _positionSize,
    Decimal.decimal memory _collateral,
    Decimal.decimal memory _leverage,
    Decimal.decimal memory _slippage,
    Decimal.decimal memory _tipFee,
    bool _reduceOnly,
    uint256 _expiry
  ) internal {
    require(((_expiry == 0 ) || (block.timestamp<_expiry)), 'Event will expire in past');
    require(_tipFee.cmp(minimum) == 1, 'Just the tip! Tip is below minimum tip fee');
    require(factory.getSmartWallet(msg.sender) != address(0), 'Need smart wallet');
    emit OrderCreated(msg.sender,orders.length);
    orders.push(LimitOrder({
      asset: _asset,
      trader: msg.sender,
      orderType: _orderType,
      stopPrice: _stopPrice,
      limitPrice: _limitPrice,
      orderSize: _positionSize,
      collateral: _collateral,
      leverage: _leverage,
      slippage: _slippage,
      tipFee: _tipFee,
      reduceOnly: _reduceOnly,
      stillValid: true,
      expiry: _expiry
      }));
  }

  function _createTrailingOrder(
    address _asset,
    Decimal.decimal memory _trail,
    Decimal.decimal memory _gap,
    boolean _usePct
  ) internal {
    uint _currSnapshot = IAmm(_asset).getSnapshotLen()-1;
    emit TrailingOrderCreated(orders.length-1, _currSnapshot);
    Decimal.decimal memory _initPrice = IAmm(_asset).getSpotPrice();
    if(usePct) {
      trailingOrders[orders.length] = TrailingOrderData({
        witnessPrice: _initPrice,
        trail: Decimal.zero(),
        trailPct: _trail,
        gap: Decimal.zero(),
        gapPct: _gap,
        usePct: true,
        snapshotCreated: _currSnapshot,
        snapshotLastUpdated: _currSnapshot,
        lastUpdatedKeeper: address(0)
      });
    } else {
      trailingOrders[orders.length-1] = TrailingOrderData({
        witnessPrice: _initPrice,
        trail: _trail,
        trailPct: Decimal.zero(),
        gap: _gap,
        gapPct: Decimal.zero(),
        usePct: false,
        snapshotCreated: _currSnapshot,
        snapshotLastUpdated: _currSnapshot,
        lastUpdatedKeeper: address(0)
      });
    }
    _updateTrailingPrice(orders.length-1);
  }

  /*
   * FUNCTIONS TO INTERACT WITH ORDERS (MODIFY/DELETE/ETC)
   */

  function modifyOrder(
    uint order_id,
    Decimal.decimal memory _stopPrice,
    Decimal.decimal memory _limitPrice,
    SignedDecimal.signedDecimal memory _orderSize,
    Decimal.decimal memory _collateral,
    Decimal.decimal memory _leverage,
    Decimal.decimal memory _slippage,
    Decimal.decimal memory _tipFee,
    bool _reduceOnly,
    uint _expiry) public onlyMyOrder(order_id) onlyValidOrder(order_id){
      require(orders[order_id].orderType == OrderType.LIMIT ||
        orders[order_id].orderType == OrderType.STOPMARKET ||
        orders[order_id].orderType == OrderType.STOPLIMIT,
        "Can only modify stop/limit orders");
      orders[order_id].stopPrice = _stopPrice;
      orders[order_id].limitPrice = _limitPrice;
      orders[order_id].orderSize = _orderSize;
      orders[order_id].collateral = _collateral;
      orders[order_id].leverage = _leverage;
      orders[order_id].slippage = _slippage;
      orders[order_id].tipFee = _tipFee;
      orders[order_id].reduceOnly = _reduceOnly;
      orders[order_id].expiry = _expiry;
      emit OrderChanged(orders[order_id].trader, order_id);
    }

  function modifyTrailingOrder(
    uint order_id,
    Decimal.decimal memory _newStop,
    Decimal.decimal memory _newLimit,
    SignedDecimal.signedDecimal memory _orderSize,
    Decimal.decimal memory _collateral,
    Decimal.decimal memory _leverage,
    Decimal.decimal memory _slippage,
    Decimal.decimal memory _tipFee,
    bool _reduceOnly,
    uint _expiry) public onlyMyOrder(order_id) onlyValidOrder(order_id){
      require(orders[order_id].orderType == OrderType.TRAILINGSTOPMARKET ||
        orders[order_id].orderType == OrderType.TRAILINGSTOPLIMIT,
        "Can only modify trailing orders");
      orders[order_id].orderSize = _orderSize;
      orders[order_id].collateral = _collateral;
      orders[order_id].leverage = _leverage;
      orders[order_id].slippage = _slippage;
      orders[order_id].tipFee = _tipFee;
      orders[order_id].reduceOnly = _reduceOnly;
      orders[order_id].expiry = _expiry;

      if(trailingOrders[order_id].usePct) {
        trailingOrders[order_id].trailPct = _newStop;
        trailingOrders[order_id].gapPct = _newLimit;
      } else {
        trailingOrders[order_id].trail = _newStop;
        trailingOrders[order_id].gap = _newLimit;
      }
      _updateTrailingPrice(order_id);

      emit OrderChanged(orders[order_id].trader, order_id);
    }

  function deleteOrder(
    uint order_id
  ) public onlyMyOrder(order_id) onlyValidOrder(order_id){
    emit OrderChanged(orders[order_id].trader, order_id);
    delete orders[order_id];
  }

  function execute(uint order_id) public onlyValidOrder(order_id) {
    require(orders[order_id].stillValid, 'No longer valid');
    emit OrderFilled(orders[order_id].trader, order_id);
    address _smartwallet = factory.getSmartWallet(orders[order_id].trader);
    bool success = SmartWallet(_smartwallet).executeOrder(order_id);
    if(success) {
      if((orders[order_id].orderType == OrderType.TRAILINGSTOPMARKET ||
          orders[order_id].orderType == OrderType.TRAILINGSTOPLIMIT) &&
          trailingOrders[order_id].lastUpdatedKeeper != address(0)) {
          _transferFrom(IERC20(USDC), _smartwallet, msg.sender, orders[order_id].tipFee.divScalar(2));
          _transferFrom(IERC20(USDC), _smartwallet, trailingOrders[order_id].lastUpdatedKeeper,
            orders[order_id].tipFee.divScalar(2));
          TrailingOrderFilled(order_id);
          delete trailingOrders[order_id];
      } else {
        _transferFrom(IERC20(USDC), _smartwallet, msg.sender, orders[order_id].tipFee);
      }
      orders[order_id].stillValid = false;
      delete orders[order_id];
    }
  }

  /*
   * FUNCTIONS RELATING TO TRAILING ORDERS
   */

    //low level call, ensure that prices have been checked before calling this
  function _updateTrailingPrice(
    uint order_id
  ) internal {
    Decimal.decimal memory _newPrice = trailingOrders[order_id].witnessPrice;
    bool isLong = orders[order_id].orderSize.isNegative() ? false : true;
    if(trailingOrders[order_id].usePct) {
      Decimal.decimal memory tpct = isLong ?
        Decimal.one().addD(trailingOrders[order_id].trailPct) :
        Decimal.one().subD(trailingOrders[order_id].trailPct);
      Decimal.decimal memory gpct = isLong ?
        Decimal.one().addD(trailingOrders[order_id].gapPct) :
        Decimal.one().subD(trailingOrders[order_id].gapPct);
      orders[order_id].stopPrice = _newPrice.mulD(tpct);
      orders[order_id].limitPrice = orders[order_id].stopPrice.mulD(gpct);
    } else {
      orders[order_id].stopPrice = isLong ?
        _newPrice.addD(trailingOrders[order_id].trail) :
        _newPrice.subD(trailingOrders[order_id].trail);
      orders[order_id].limitPrice = isLong ?
        orders[order_id].stopPrice.addD(trailingOrders[order_id].gap) :
        orders[order_id].stopPrice.subD(trailingOrders[order_id].gap);
    }
  }

  function pokeContract(
    uint order_id,
    uint _reserveIndex
  ) public {
    require(orders[order_id].orderType == OrderType.TRAILINGSTOPMARKET ||
      orders[order_id].orderType == OrderType.TRAILINGSTOPLIMIT, "Can only poke trailing orders");
    require(_reserveIndex > trailingOrders[order_id].snapshotCreated, "Order hadn't been created");

    require(_reserveIndex < trailingOrders[order_id].snapshotLastUpdated ||
      (block.timestamp - trailingOrders[order_id].snapshotLastUpdated > pokeContractDelay), "Can only be updated every 15 minutes");
    trailingOrders[order_id].snapshotLastUpdated = block.timestamp;

    bool isLong = orders[order_id].orderSize.isNegative() ? false : true;

    Decimal.decimal memory _newPrice = getPriceAtSnapshot(
      IAmm(orders[order_id].asset), _reserveIndex);

    require(trailingOrders[order_id].witnessPrice.cmp(_newPrice) == (isLong ? int128(1) : -1),
      "Incorrect trailing price");

    trailingOrders[order_id].witnessPrice = _newPrice;
    trailingOrders[order_id].snapshotLastUpdated = _reserveIndex;
    trailingOrders[order_id].lastUpdatedKeeper = msg.sender;
    _updateTrailingPrice(order_id);
  }

  /*
   * VIEW FUNCTIONS
   */

  function getNumberOrders() public view returns (uint){
    return orders.length;
  }

  function getTrailingData(
    uint order_id
  ) public view returns (TrailingOrderData memory){
    return trailingOrders[order_id];
  }

  function getPriceAtSnapshot( //the function in AMM isn't in aBI??
    IAmm _asset,
    uint256 _snapshotIndex
  ) public view returns (Decimal.decimal memory) {
    IAmm.ReserveSnapshot memory snap = _asset.reserveSnapshots(_snapshotIndex);
    return snap.quoteAssetReserve.divD(snap.baseAssetReserve);
  }

  function getLimitOrder(
    uint order_id
  ) public view onlyValidOrder(order_id)
    returns (LimitOrder memory) {
    return (orders[order_id]);
  }

  function getLimitOrderPrices(
    uint id
  ) public view onlyValidOrder(id)
    returns(
      Decimal.decimal memory,
      Decimal.decimal memory,
      SignedDecimal.signedDecimal memory,
      Decimal.decimal memory,
      Decimal.decimal memory,
      Decimal.decimal memory,
      Decimal.decimal memory) {
    LimitOrder memory order = orders[id];
    return (order.stopPrice,
      order.limitPrice,
      order.orderSize,
      order.collateral,
      order.leverage,
      order.slippage,
      order.tipFee);
  }

  function getLimitOrderParams(
    uint id
  ) public view onlyValidOrder(id)
    returns(
      address,
      address,
      OrderType,
      bool,
      bool,
      uint256) {
    LimitOrder memory order = orders[id];
    return (order.asset,
      order.trader,
      order.orderType,
      order.reduceOnly,
      order.stillValid,
      order.expiry);
  }

  /*
   * ADMIN / SETUP FUNCTIONS
   */

  function setFactory(address _addr) public onlyOwner{
    factory = SmartWalletFactory(_addr);
  }

  /*
   * MODIFIERS
   */

  modifier onlyValidOrder(uint order_id) {
    require(order_id < orders.length, 'Invalid ID');
    _;
  }

  modifier onlyMyOrder(uint order_id) {
    require(msg.sender == orders[order_id].trader, "Just not your limit order");
    _;
  }

}
