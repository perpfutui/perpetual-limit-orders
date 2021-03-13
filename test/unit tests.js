const { expect } = require("chai");
const abiDecoder = require('abi-decoder');

describe("Perpetual limit orders", function() {

  let owner;
  //Alice will spawn smart wallet but not have any funds
  let Alice;
  let AliceSW;
  let AliceSWC;
  //Bob will add funds
  let Bob;
  let BobSW;
  let BobSWC;
  let LOB;
  let lob;
  let SWF;
  let swf;
  let CHInterface;
  let USDCInterface;

  const MINIMUM_FEE = ethers.utils.parseUnits('0.1',18)
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
  const UINT_MAX = '115792089237316195423570985008687907853269984665640564039457584007913129639935'
  const USDC_Address = '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83'
  const ClearingHouse_Address = '0x5d9593586b4B5edBd23E7Eba8d88FD8F09D83EBd'
  const BTC_Address = '0x0f346e19F01471C02485DF1758cfd3d624E399B4'

  const ERC20_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"authorizer","type":"address"},{"indexed":true,"internalType":"bytes32","name":"nonce","type":"bytes32"}],"name":"AuthorizationCanceled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"authorizer","type":"address"},{"indexed":true,"internalType":"bytes32","name":"nonce","type":"bytes32"}],"name":"AuthorizationUsed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_account","type":"address"}],"name":"Blacklisted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"newBlacklister","type":"address"}],"name":"BlacklisterChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"burner","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"newMasterMinter","type":"address"}],"name":"MasterMinterChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"minter","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"minter","type":"address"},{"indexed":false,"internalType":"uint256","name":"minterAllowedAmount","type":"uint256"}],"name":"MinterConfigured","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oldMinter","type":"address"}],"name":"MinterRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":false,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[],"name":"Pause","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"newAddress","type":"address"}],"name":"PauserChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"newRescuer","type":"address"}],"name":"RescuerChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_account","type":"address"}],"name":"UnBlacklisted","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpause","type":"event"},{"inputs":[],"name":"APPROVE_WITH_AUTHORIZATION_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"CANCEL_AUTHORIZATION_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DECREASE_ALLOWANCE_WITH_AUTHORIZATION_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"INCREASE_ALLOWANCE_WITH_AUTHORIZATION_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"TRANSFER_WITH_AUTHORIZATION_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"validAfter","type":"uint256"},{"internalType":"uint256","name":"validBefore","type":"uint256"},{"internalType":"bytes32","name":"nonce","type":"bytes32"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"approveWithAuthorization","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"authorizer","type":"address"},{"internalType":"bytes32","name":"nonce","type":"bytes32"}],"name":"authorizationState","outputs":[{"internalType":"enum GasAbstraction.AuthorizationState","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_account","type":"address"}],"name":"blacklist","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"blacklister","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"authorizer","type":"address"},{"internalType":"bytes32","name":"nonce","type":"bytes32"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"cancelAuthorization","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"minter","type":"address"},{"internalType":"uint256","name":"minterAllowedAmount","type":"uint256"}],"name":"configureMinter","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"currency","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"decrement","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"decrement","type":"uint256"},{"internalType":"uint256","name":"validAfter","type":"uint256"},{"internalType":"uint256","name":"validBefore","type":"uint256"},{"internalType":"bytes32","name":"nonce","type":"bytes32"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"decreaseAllowanceWithAuthorization","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"increment","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"increment","type":"uint256"},{"internalType":"uint256","name":"validAfter","type":"uint256"},{"internalType":"uint256","name":"validBefore","type":"uint256"},{"internalType":"bytes32","name":"nonce","type":"bytes32"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"increaseAllowanceWithAuthorization","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"tokenName","type":"string"},{"internalType":"string","name":"tokenSymbol","type":"string"},{"internalType":"string","name":"tokenCurrency","type":"string"},{"internalType":"uint8","name":"tokenDecimals","type":"uint8"},{"internalType":"address","name":"newMasterMinter","type":"address"},{"internalType":"address","name":"newPauser","type":"address"},{"internalType":"address","name":"newBlacklister","type":"address"},{"internalType":"address","name":"newOwner","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"newName","type":"string"}],"name":"initializeV2","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_account","type":"address"}],"name":"isBlacklisted","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"isMinter","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"masterMinter","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"mint","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"minter","type":"address"}],"name":"minterAllowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pauser","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"minter","type":"address"}],"name":"removeMinter","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"tokenContract","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"rescueERC20","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"rescuer","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"validAfter","type":"uint256"},{"internalType":"uint256","name":"validBefore","type":"uint256"},{"internalType":"bytes32","name":"nonce","type":"bytes32"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"transferWithAuthorization","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_account","type":"address"}],"name":"unBlacklist","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_newBlacklister","type":"address"}],"name":"updateBlacklister","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_newMasterMinter","type":"address"}],"name":"updateMasterMinter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_newPauser","type":"address"}],"name":"updatePauser","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newRescuer","type":"address"}],"name":"updateRescuer","outputs":[],"stateMutability":"nonpayable","type":"function"}]

  const CH_ABI = [
    {"type":"event","name":"LiquidationFeeRatioChanged","inputs":[{"type":"uint256","name":"liquidationFeeRatio","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"MarginChanged","inputs":[{"type":"address","name":"sender","internalType":"address","indexed":true},{"type":"address","name":"amm","internalType":"address","indexed":true},{"type":"int256","name":"amount","internalType":"int256","indexed":false},{"type":"int256","name":"fundingPayment","internalType":"int256","indexed":false}],"anonymous":false},{"type":"event","name":"MarginRatioChanged","inputs":[{"type":"uint256","name":"marginRatio","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"OwnershipTransferred","inputs":[{"type":"address","name":"previousOwner","internalType":"address","indexed":true},{"type":"address","name":"newOwner","internalType":"address","indexed":true}],"anonymous":false},{"type":"event","name":"Paused","inputs":[{"type":"address","name":"account","internalType":"address","indexed":false}],"anonymous":false},{"type":"event","name":"PositionAdjusted","inputs":[{"type":"address","name":"amm","internalType":"address","indexed":true},{"type":"address","name":"trader","internalType":"address","indexed":true},{"type":"int256","name":"newPositionSize","internalType":"int256","indexed":false},{"type":"uint256","name":"oldLiquidityIndex","internalType":"uint256","indexed":false},{"type":"uint256","name":"newLiquidityIndex","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"PositionChanged","inputs":[{"type":"address","name":"trader","internalType":"address","indexed":true},{"type":"address","name":"amm","internalType":"address","indexed":true},{"type":"uint256","name":"margin","internalType":"uint256","indexed":false},{"type":"uint256","name":"positionNotional","internalType":"uint256","indexed":false},{"type":"int256","name":"exchangedPositionSize","internalType":"int256","indexed":false},{"type":"uint256","name":"fee","internalType":"uint256","indexed":false},{"type":"int256","name":"positionSizeAfter","internalType":"int256","indexed":false},{"type":"int256","name":"realizedPnl","internalType":"int256","indexed":false},{"type":"int256","name":"unrealizedPnlAfter","internalType":"int256","indexed":false},{"type":"uint256","name":"badDebt","internalType":"uint256","indexed":false},{"type":"uint256","name":"liquidationPenalty","internalType":"uint256","indexed":false},{"type":"uint256","name":"spotPrice","internalType":"uint256","indexed":false},{"type":"int256","name":"fundingPayment","internalType":"int256","indexed":false}],"anonymous":false},{"type":"event","name":"PositionLiquidated","inputs":[{"type":"address","name":"trader","internalType":"address","indexed":true},{"type":"address","name":"amm","internalType":"address","indexed":true},{"type":"uint256","name":"positionNotional","internalType":"uint256","indexed":false},{"type":"uint256","name":"positionSize","internalType":"uint256","indexed":false},{"type":"uint256","name":"liquidationFee","internalType":"uint256","indexed":false},{"type":"address","name":"liquidator","internalType":"address","indexed":false},{"type":"uint256","name":"badDebt","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"PositionSettled","inputs":[{"type":"address","name":"amm","internalType":"address","indexed":true},{"type":"address","name":"trader","internalType":"address","indexed":true},{"type":"uint256","name":"valueTransferred","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"RestrictionModeEntered","inputs":[{"type":"address","name":"amm","internalType":"address","indexed":false},{"type":"uint256","name":"blockNumber","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"Unpaused","inputs":[{"type":"address","name":"account","internalType":"address","indexed":false}],"anonymous":false},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"addMargin","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"},{"type":"tuple","name":"_addedMargin","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"adjustPosition","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"address"}],"name":"candidate","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"closePosition","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"},{"type":"tuple","name":"_quoteAssetAmountLimit","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"contract IMultiTokenRewardRecipient"}],"name":"feePool","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}],"name":"getLatestCumulativePremiumFraction","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}],"name":"getMarginRatio","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"},{"type":"address","name":"_trader","internalType":"address"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct ClearingHouse.Position","components":[{"type":"tuple","name":"size","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]},{"type":"tuple","name":"margin","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"openNotional","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"lastUpdatedCumulativePremiumFraction","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]},{"type":"uint256","name":"liquidityHistoryIndex","internalType":"uint256"},{"type":"uint256","name":"blockNumber","internalType":"uint256"}]}],"name":"getPosition","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"},{"type":"address","name":"_trader","internalType":"address"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"positionNotional","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"unrealizedPnl","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}],"name":"getPositionNotionalAndUnrealizedPnl","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"},{"type":"address","name":"_trader","internalType":"address"},{"type":"uint8","name":"_pnlCalcOption","internalType":"enum ClearingHouse.PnlCalcOption"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"position","internalType":"struct ClearingHouse.Position","components":[{"type":"tuple","name":"size","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]},{"type":"tuple","name":"margin","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"openNotional","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"lastUpdatedCumulativePremiumFraction","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]},{"type":"uint256","name":"liquidityHistoryIndex","internalType":"uint256"},{"type":"uint256","name":"blockNumber","internalType":"uint256"}]}],"name":"getUnadjustedPosition","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"},{"type":"address","name":"_trader","internalType":"address"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"initMarginRatio","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"initialize","inputs":[{"type":"uint256","name":"_initMarginRatio","internalType":"uint256"},{"type":"uint256","name":"_maintenanceMarginRatio","internalType":"uint256"},{"type":"uint256","name":"_liquidationFeeRatio","internalType":"uint256"},{"type":"address","name":"_insuranceFund","internalType":"contract IInsuranceFund"},{"type":"address","name":"_trustedForwarder","internalType":"address"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"contract IInsuranceFund"}],"name":"insuranceFund","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"isTrustedForwarder","inputs":[{"type":"address","name":"forwarder","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"liquidate","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"},{"type":"address","name":"_trader","internalType":"address"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"liquidationFeeRatio","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"maintenanceMarginRatio","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"openInterestNotionalMap","inputs":[{"type":"address","name":"","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"openPosition","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"},{"type":"uint8","name":"_side","internalType":"enum ClearingHouse.Side"},{"type":"tuple","name":"_quoteAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_leverage","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_baseAssetAmountLimit","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"address"}],"name":"owner","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"pause","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"paused","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"payFunding","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"removeMargin","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"},{"type":"tuple","name":"_removedMargin","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"renounceOwnership","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setFeePool","inputs":[{"type":"address","name":"_feePool","internalType":"contract IMultiTokenRewardRecipient"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setLiquidationFeeRatio","inputs":[{"type":"tuple","name":"_liquidationFeeRatio","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setMaintenanceMarginRatio","inputs":[{"type":"tuple","name":"_maintenanceMarginRatio","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setOwner","inputs":[{"type":"address","name":"newOwner","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setWhitelist","inputs":[{"type":"address","name":"_whitelist","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"settlePosition","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"address"}],"name":"trustedForwarder","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"unpause","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"updateOwner","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"string","name":"","internalType":"string"}],"name":"versionRecipient","inputs":[]}
  ]

  const AMM_ABI = [
    {"type":"event","name":"CapChanged","inputs":[{"type":"uint256","name":"maxHoldingBaseAsset","internalType":"uint256","indexed":false},{"type":"uint256","name":"openInterestNotionalCap","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"FundingRateUpdated","inputs":[{"type":"int256","name":"rate","internalType":"int256","indexed":false},{"type":"uint256","name":"underlyingPrice","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"LiquidityChanged","inputs":[{"type":"uint256","name":"quoteReserve","internalType":"uint256","indexed":false},{"type":"uint256","name":"baseReserve","internalType":"uint256","indexed":false},{"type":"int256","name":"cumulativeNotional","internalType":"int256","indexed":false}],"anonymous":false},{"type":"event","name":"OwnershipTransferred","inputs":[{"type":"address","name":"previousOwner","internalType":"address","indexed":true},{"type":"address","name":"newOwner","internalType":"address","indexed":true}],"anonymous":false},{"type":"event","name":"ReserveSnapshotted","inputs":[{"type":"uint256","name":"quoteAssetReserve","internalType":"uint256","indexed":false},{"type":"uint256","name":"baseAssetReserve","internalType":"uint256","indexed":false},{"type":"uint256","name":"timestamp","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"Shutdown","inputs":[{"type":"uint256","name":"settlementPrice","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"SwapInput","inputs":[{"type":"uint8","name":"dir","internalType":"enum IAmm.Dir","indexed":false},{"type":"uint256","name":"quoteAssetAmount","internalType":"uint256","indexed":false},{"type":"uint256","name":"baseAssetAmount","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"SwapOutput","inputs":[{"type":"uint8","name":"dir","internalType":"enum IAmm.Dir","indexed":false},{"type":"uint256","name":"quoteAssetAmount","internalType":"uint256","indexed":false},{"type":"uint256","name":"baseAssetAmount","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"baseAssetReserve","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}],"name":"calcBaseAssetAfterLiquidityMigration","inputs":[{"type":"tuple","name":"_baseAssetAmount","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]},{"type":"tuple","name":"_fromQuoteReserve","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_fromBaseReserve","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"calcFee","inputs":[{"type":"tuple","name":"_quoteAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"address"}],"name":"candidate","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"fluctuationLimitRatio","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"fundingBufferPeriod","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"fundingPeriod","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"int256","name":"d","internalType":"int256"}],"name":"fundingRate","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}],"name":"getBaseAssetDelta","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}],"name":"getBaseAssetDeltaThisFundingPeriod","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}],"name":"getCumulativeNotional","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getInputPrice","inputs":[{"type":"uint8","name":"_dir","internalType":"enum IAmm.Dir"},{"type":"tuple","name":"_quoteAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"pure","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getInputPriceWithReserves","inputs":[{"type":"uint8","name":"_dir","internalType":"enum IAmm.Dir"},{"type":"tuple","name":"_quoteAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_quoteAssetPoolAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_baseAssetPoolAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getInputTwap","inputs":[{"type":"uint8","name":"_dir","internalType":"enum IAmm.Dir"},{"type":"tuple","name":"_quoteAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct IAmm.LiquidityChangedSnapshot","components":[{"type":"tuple","name":"cumulativeNotional","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]},{"type":"tuple","name":"quoteAssetReserve","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"baseAssetReserve","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"totalPositionSize","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}]}],"name":"getLatestLiquidityChangedSnapshots","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct IAmm.LiquidityChangedSnapshot","components":[{"type":"tuple","name":"cumulativeNotional","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]},{"type":"tuple","name":"quoteAssetReserve","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"baseAssetReserve","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"totalPositionSize","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}]}],"name":"getLiquidityChangedSnapshots","inputs":[{"type":"uint256","name":"i","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"getLiquidityHistoryLength","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getMaxHoldingBaseAsset","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getOpenInterestNotionalCap","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getOutputPrice","inputs":[{"type":"uint8","name":"_dir","internalType":"enum IAmm.Dir"},{"type":"tuple","name":"_baseAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"pure","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getOutputPriceWithReserves","inputs":[{"type":"uint8","name":"_dir","internalType":"enum IAmm.Dir"},{"type":"tuple","name":"_baseAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_quoteAssetPoolAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_baseAssetPoolAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getOutputTwap","inputs":[{"type":"uint8","name":"_dir","internalType":"enum IAmm.Dir"},{"type":"tuple","name":"_baseAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getReserve","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getSettlementPrice","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"getSnapshotLen","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getSpotPrice","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getTwapPrice","inputs":[{"type":"uint256","name":"_intervalInSeconds","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getUnderlyingPrice","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getUnderlyingTwapPrice","inputs":[{"type":"uint256","name":"_intervalInSeconds","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"address"}],"name":"globalShutdown","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"initialize","inputs":[{"type":"uint256","name":"_quoteAssetReserve","internalType":"uint256"},{"type":"uint256","name":"_baseAssetReserve","internalType":"uint256"},{"type":"uint256","name":"_tradeLimitRatio","internalType":"uint256"},{"type":"uint256","name":"_fundingPeriod","internalType":"uint256"},{"type":"address","name":"_priceFeed","internalType":"contract IPriceFeed"},{"type":"bytes32","name":"_priceFeedKey","internalType":"bytes32"},{"type":"address","name":"_quoteAsset","internalType":"address"},{"type":"uint256","name":"_fluctuationLimitRatio","internalType":"uint256"},{"type":"uint256","name":"_tollRatio","internalType":"uint256"},{"type":"uint256","name":"_spreadRatio","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"nextFundingTime","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"open","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"address"}],"name":"owner","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"contract IPriceFeed"}],"name":"priceFeed","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"bytes32","name":"","internalType":"bytes32"}],"name":"priceFeedKey","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"contract IERC20"}],"name":"quoteAsset","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"quoteAssetReserve","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"renounceOwnership","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"quoteAssetReserve","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"baseAssetReserve","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"uint256","name":"timestamp","internalType":"uint256"},{"type":"uint256","name":"blockNumber","internalType":"uint256"}],"name":"reserveSnapshots","inputs":[{"type":"uint256","name":"","internalType":"uint256"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setCap","inputs":[{"type":"tuple","name":"_maxHoldingBaseAsset","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_openInterestNotionalCap","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setCounterParty","inputs":[{"type":"address","name":"_counterParty","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setFluctuationLimitRatio","inputs":[{"type":"tuple","name":"_fluctuationLimitRatio","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setGlobalShutdown","inputs":[{"type":"address","name":"_globalShutdown","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setOpen","inputs":[{"type":"bool","name":"_open","internalType":"bool"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setOwner","inputs":[{"type":"address","name":"newOwner","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setSpotPriceTwapInterval","inputs":[{"type":"uint256","name":"_interval","internalType":"uint256"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setSpreadRatio","inputs":[{"type":"tuple","name":"_spreadRatio","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setTollRatio","inputs":[{"type":"tuple","name":"_tollRatio","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"tuple","name":"","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}],"name":"settleFunding","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"shutdown","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"spotPriceTwapInterval","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"spreadRatio","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"swapInput","inputs":[{"type":"uint8","name":"_dir","internalType":"enum IAmm.Dir"},{"type":"tuple","name":"_quoteAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_baseAssetAmountLimit","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"swapOutput","inputs":[{"type":"uint8","name":"_dir","internalType":"enum IAmm.Dir"},{"type":"tuple","name":"_baseAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_quoteAssetAmountLimit","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"bool","name":"_skipFluctuationCheck","internalType":"bool"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"tollAmount","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"tollRatio","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"int256","name":"d","internalType":"int256"}],"name":"totalPositionSize","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"tradeLimitRatio","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"updateOwner","inputs":[]}]

abiDecoder.addABI(ERC20_ABI)
abiDecoder.addABI(CH_ABI)
abiDecoder.addABI(AMM_ABI)

  beforeEach(async function() {
    [owner, Alice, Bob] = await ethers.getSigners()
    usdc = await ethers.getContractAt(ERC20_ABI, USDC_Address)
    CHInterface = new ethers.utils.Interface(CH_ABI)
    USDCInterface = new ethers.utils.Interface(ERC20_ABI)
    BTC_AMM = await ethers.getContractAt(AMM_ABI, BTC_Address)
    CH = await ethers.getContractAt(CH_ABI, ClearingHouse_Address)
  })

  describe("Testing deployment", function() {

    it("Deploying LOB", async function() {
      LOB = await ethers.getContractFactory("LimitOrderBook")
      lob = await LOB.deploy()
      await lob.deployed()
    })

    it("Deploying SWF", async function() {
      SWF = await ethers.getContractFactory("SmartWalletFactory")
      swf = await SWF.deploy(lob.address)
      await swf.deployed()
    })

    it("Linking factory to LOB", async function() {
      await lob.setFactory(swf.address)
      expect(await lob.factory()).to.equal(swf.address)
    })

    it("Ensuring that only admin can update factory", async function() {
      await expect(lob.connect(Alice).setFactory(Alice.address)).
        to.be.revertedWith('Ownable: caller is not the owner')
    })

    it("Setting tipFee to 0.1", async function() {
      await lob.changeMinimumFee({d: MINIMUM_FEE})
      expect((await lob.minimumTipFee())).to.equal(MINIMUM_FEE)
    })

    it("Ensure tha only admin can update fee", async function() {
      await expect(lob.connect(Alice).changeMinimumFee({d: MINIMUM_FEE})).
        to.be.revertedWith('Ownable: caller is not the owner')
    })

  })

  describe("Testing Smart Wallet basic functionality", function() {

    it("Attempt to spawn Alice's Smart Wallet", async function() {
      expect(await swf.getSmartWallet(Alice.address)).to.equal(ZERO_ADDRESS)
      await swf.connect(Alice).spawn()
      AliceSW = await swf.getSmartWallet(Alice.address)
      expect(AliceSW).to.not.equal(ZERO_ADDRESS)
      AliceSWC = await ethers.getContractAt('SmartWallet', AliceSW)
    })

    it("Should revert second smart wallet", async function() {
      await expect(swf.connect(Alice).spawn()).to.be.revertedWith('Already has smart wallet')
    })

    it("Smart wallet needs to have factory", async function() {
      expect(await AliceSWC.factory()).to.equal(swf.address)
    })

    it("Smart wallet needs to have limit order book", async function() {
      expect(await AliceSWC.LOB()).to.equal(lob.address)
    })
/*
    it("Checking approval of USDC", async function() {
      expect(await usdc.allowance(AliceSW, lob.address)).to.equal(UINT_MAX)
      expect(await usdc.allowance(AliceSW, ClearingHouse_Address)).to.equal(UINT_MAX)
    })
*/
    it("Prevent Bob from executing orders on Alice's Smart Wallet", async function() {
      var fn = CHInterface.encodeFunctionData('addMargin(address,(uint256))',
      ['0x0f346e19F01471C02485DF1758cfd3d624E399B4',
      {d: ethers.utils.parseUnits('1',18)}])
      await expect(AliceSWC.connect(Bob).executeCall(ClearingHouse_Address, fn))
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it("Prevent forwarded calls to non-smart contracts", async function() {
      var fn = CHInterface.encodeFunctionData('addMargin(address,(uint256))',
      ['0x0f346e19F01471C02485DF1758cfd3d624E399B4',
      {d: ethers.utils.parseUnits('1',18)}])
      await expect(AliceSWC.connect(Alice).executeCall(Bob.address, fn))
        .to.be.revertedWith('call to non-contract')
    })

  })

  describe("Creating Bob's account for trading", function() {

    it("Spawning smart wallet", async function() {
      await swf.connect(Bob).spawn()
      BobSW = swf.getSmartWallet(Bob.address)
      BobSWC = await ethers.getContractAt('SmartWallet', BobSW)
    })

    it("Giving Bob some money", async function() {
      await network.provider.request({ method: "hardhat_impersonateAccount",  params: ["0x1A48776f436bcDAA16845A378666cf4BA131eb0F"]});
      const sugarDaddy = await ethers.provider.getSigner('0x1A48776f436bcDAA16845A378666cf4BA131eb0F')
      await usdc.connect(sugarDaddy).transfer(BobSW, ethers.utils.parseUnits('120000', 6))
    })

    it("Approve BOB to spend USDC on LOB", async function() {
      var fn = USDCInterface.encodeFunctionData('approve(address, uint256)',[lob.address, '1000000000'])
      await BobSWC.connect(Bob).executeCall(USDC_Address, fn)
      expect(await usdc.allowance(BobSW,lob.address)).to.equal('1000000000')

    })

  })

  describe("Creating/Submitting orders", function() {
/*
    describe("MARKET ORDERS", function() {

      it("Should revert if no money", async function() {
        var fn = CHInterface.encodeFunctionData('openPosition(address,uint8,(uint256),(uint256),(uint256))', [
          BTC_Address,
          0,
          {d: ethers.utils.parseUnits('50000', 18)},
          {d: ethers.utils.parseUnits('1', 18)},
          {d: ethers.utils.parseUnits('0', 18)},
        ])
        await expect(AliceSWC.connect(Alice).executeCall(ClearingHouse_Address, fn))
          .to.be.revertedWith('DecimalERC20: transferFrom failed')
      })

      it("Creating market order", async function() {
        var order_size = ethers.utils.parseUnits('50000', 18)
        var balanceBefore = await usdc.balanceOf(BobSW)
        var price = (await BTC_AMM.getInputPrice(0, {d: order_size})).d
        var fn = CHInterface.encodeFunctionData('openPosition(address,uint8,(uint256),(uint256),(uint256))', [
          BTC_Address,
          0,
          {d: order_size},
          {d: ethers.utils.parseUnits('1', 18)},
          {d: ethers.utils.parseUnits('0', 18)},
        ])
        await BobSWC.connect(Bob).executeCall(ClearingHouse_Address, fn)
        var balanceAfter = await usdc.balanceOf(BobSW)
        var output = await CH.getPosition(BTC_Address, BobSW)
        expect(output.size.d).to.equal(price)
        expect(ethers.utils.formatUnits(balanceBefore.sub(balanceAfter),6)).to.equal(ethers.utils.formatUnits(order_size.mul(1001).div(1000),18))
      })

      it("Closing position", async function() {
        var fn = CHInterface.encodeFunctionData('closePosition(address,(uint256))', [
          BTC_Address,
          {d: ethers.utils.parseUnits('0', 18)}
        ])
        await BobSWC.connect(Bob).executeCall(ClearingHouse_Address, fn)
        var output = await CH.getPosition(BTC_Address, BobSW)
        expect(output.size.d).to.equal('0')
      })

    })
*/
    describe("LIMIT ORDERS", function() {

      let index;

      it("Creating limit order", async function() {
        var cur_price = await BTC_AMM.getSpotPrice() //51773
        index = await lob.getNumberOrders()
        var limit_price = cur_price.d.sub(ethers.utils.parseUnits('1000',18))
        var size = ethers.utils.parseUnits('1',18)
        var collateral = limit_price
        var leverage = ethers.utils.parseUnits('1',18)
        var slippage = 0
        var tipFee = MINIMUM_FEE
        var reduceOnly = false
        var expiry = 0
        await lob.connect(Bob).addLimitOrder(
          BTC_Address,
          {d: limit_price},
          {d: size},
          {d: collateral},
          {d: leverage},
          {d: slippage},
          {d: tipFee},
          reduceOnly,
          expiry
        )
        var order = await lob.getLimitOrder(index)
        expect(order.asset).to.equal(BTC_Address)
        expect(order.trader).to.equal(Bob.address)
        expect(order.orderType).to.equal(1) //Limit order
        expect(order.reduceOnly).to.equal(reduceOnly)
        expect(order.stillValid).to.equal(true)
        expect(order.expiry).to.equal(expiry)
        expect(order.stopPrice.d).to.equal(0)
        expect(order.limitPrice.d).to.equal(limit_price)
        expect(order.orderSize.d).to.equal(size)
        expect(order.collateral.d).to.equal(collateral)
        expect(order.leverage.d).to.equal(leverage)
        expect(order.slippage.d).to.equal(slippage)
        expect(order.tipFee.d).to.equal(tipFee)
      })

      it("Should fail to execute that order", async function() {
        await expect(lob.execute(index)).to.be
          .revertedWith('Price has not hit limit price')
      })

      it("Updating order to adjust price", async function() {
        var cur_price = await BTC_AMM.getSpotPrice() //51773
        var limit_price = cur_price.d.add(ethers.utils.parseUnits('1000',18))
        var size = ethers.utils.parseUnits('1',18)
        var collateral = limit_price
        var leverage = ethers.utils.parseUnits('1',18)
        var slippage = 0
        var reduceOnly = false
        var expiry = 0
        await lob.connect(Bob).modifyOrder(
          0,
          {d: '0'},
          {d: limit_price},
          {d: size},
          {d: collateral},
          {d: leverage},
          {d: slippage},
          reduceOnly,
          expiry
        )
        var order = await lob.getLimitOrder(index)
        expect(order.asset).to.equal(BTC_Address)
        expect(order.trader).to.equal(Bob.address)
        expect(order.orderType).to.equal(1) //Limit order
        expect(order.reduceOnly).to.equal(reduceOnly)
        expect(order.stillValid).to.equal(true)
        expect(order.expiry).to.equal(expiry)
        expect(order.stopPrice.d).to.equal(0)
        expect(order.limitPrice.d).to.equal(limit_price)
        expect(order.orderSize.d).to.equal(size)
        expect(order.collateral.d).to.equal(collateral)
        expect(order.leverage.d).to.equal(leverage)
        expect(order.slippage.d).to.equal(slippage)
        expect(order.tipFee.d).to.equal(MINIMUM_FEE)
      })

      it("Should now execute that order", async function() {
        let tx = await lob.execute(index)
        // let receipt = await tx.wait()
        // const decodedLogs = abiDecoder.decodeLogs(receipt.logs);
        // decodedLogs.filter((ev) => ev.name=="Transfer").map((evt) => {
        //   console.log(evt.events)
        // })
        var output = await CH.getPosition(BTC_Address, BobSW)
        expect(output.size.d).to.not.equal('0')
      })

      it("Should revert if size = 0", async function() {
        var cur_price = await BTC_AMM.getSpotPrice()
        var limit_price = cur_price.d
        var size = ethers.utils.parseUnits('0',18)
        var collateral = limit_price
        var leverage = ethers.utils.parseUnits('1',18)
        var slippage = 0
        var tipFee = MINIMUM_FEE
        var reduceOnly = false
        var expiry = 0
        await expect(lob.connect(Bob).addLimitOrder(
          BTC_Address,
          {d: limit_price},
          {d: size},
          {d: collateral},
          {d: leverage},
          {d: slippage},
          {d: tipFee},
          reduceOnly,
          expiry
        )).to.be.revertedWith('Cannot do empty order')
      })

      it("Should revert if collateral = 0", async function() {
        var cur_price = await BTC_AMM.getSpotPrice()
        var limit_price = cur_price.d
        var size = ethers.utils.parseUnits('1',18)
        var collateral = ethers.utils.parseUnits('0',18)
        var leverage = ethers.utils.parseUnits('1',18)
        var slippage = 0
        var tipFee = MINIMUM_FEE
        var reduceOnly = false
        var expiry = 0
        await expect(lob.connect(Bob).addLimitOrder(
          BTC_Address,
          {d: limit_price},
          {d: size},
          {d: collateral},
          {d: leverage},
          {d: slippage},
          {d: tipFee},
          reduceOnly,
          expiry
        )).to.be.revertedWith('Cannot spend 0 collateral')
      })

      it("Should revert if leverage = 0", async function() {
        var cur_price = await BTC_AMM.getSpotPrice()
        var limit_price = cur_price.d
        var size = ethers.utils.parseUnits('1',18)
        var collateral = limit_price
        var leverage = ethers.utils.parseUnits('0.9',18)
        var slippage = 0
        var tipFee = MINIMUM_FEE
        var reduceOnly = false
        var expiry = 0
        await expect(lob.connect(Bob).addLimitOrder(
          BTC_Address,
          {d: limit_price},
          {d: size},
          {d: collateral},
          {d: leverage},
          {d: slippage},
          {d: tipFee},
          reduceOnly,
          expiry
        )).to.be.revertedWith('Minimum 1x leverage')
      })

      it("Should revert if order in past", async function() {
        var cur_price = await BTC_AMM.getSpotPrice()
        var limit_price = cur_price.d
        var size = ethers.utils.parseUnits('1',18)
        var collateral = limit_price
        var leverage = ethers.utils.parseUnits('1',18)
        var slippage = 0
        var tipFee = MINIMUM_FEE
        var reduceOnly = false
        var block = await ethers.provider.getBlock('latest')
        var expiry = block.timestamp
        await expect(lob.connect(Bob).addLimitOrder(
          BTC_Address,
          {d: limit_price},
          {d: size},
          {d: collateral},
          {d: leverage},
          {d: slippage},
          {d: tipFee},
          reduceOnly,
          expiry
        )).to.be.revertedWith('Event will expire in past')
      })

    })

    describe("STOP ORDER", function() {
      let index;

      it("Creating stop order", async function() {
        var cur_price = await BTC_AMM.getSpotPrice() //51773
        index = await lob.getNumberOrders()
        var stop_price = cur_price.d.add(ethers.utils.parseUnits('1000',18))
        var size = ethers.utils.parseUnits('1',18)
        var collateral = ethers.utils.parseUnits('50000',18)
        var leverage = ethers.utils.parseUnits('1',18)
        var slippage = 0
        var tipFee = MINIMUM_FEE
        var reduceOnly = false
        var expiry = 0
        await lob.connect(Bob).addStopOrder(
          BTC_Address,
          {d: stop_price},
          {d: size},
          {d: collateral},
          {d: leverage},
          {d: slippage},
          {d: tipFee},
          reduceOnly,
          expiry
        )
        var order = await lob.getLimitOrder(index)
        expect(order.asset).to.equal(BTC_Address)
        expect(order.trader).to.equal(Bob.address)
        expect(order.orderType).to.equal(2) //Stop order
        expect(order.reduceOnly).to.equal(reduceOnly)
        expect(order.stillValid).to.equal(true)
        expect(order.expiry).to.equal(expiry)
        expect(order.stopPrice.d).to.equal(stop_price)
        expect(order.limitPrice.d).to.equal(0)
        expect(order.orderSize.d).to.equal(size)
        expect(order.collateral.d).to.equal(collateral)
        expect(order.leverage.d).to.equal(leverage)
        expect(order.slippage.d).to.equal(slippage)
        expect(order.tipFee.d).to.equal(tipFee)
      })

      it("Should fail to execute that order", async function() {
        await expect(lob.execute(index)).to.be
          .revertedWith('Price has not hit stop price')
      })

      it("Updating order to adjust price", async function() {
        var cur_price = await BTC_AMM.getSpotPrice() //51773
        var stop_price = cur_price.d.sub(ethers.utils.parseUnits('2000',18))
        var size = ethers.utils.parseUnits('1',18)
        var collateral = ethers.utils.parseUnits('50000',18)
        var leverage = ethers.utils.parseUnits('1',18)
        var slippage = 0
        var reduceOnly = false
        var expiry = 0
        await lob.connect(Bob).modifyOrder(
          index,
          {d: stop_price},
          {d: '0'},
          {d: size},
          {d: collateral},
          {d: leverage},
          {d: slippage},
          reduceOnly,
          expiry
        )
        var order = await lob.getLimitOrder(index)
        expect(order.asset).to.equal(BTC_Address)
        expect(order.trader).to.equal(Bob.address)
        expect(order.orderType).to.equal(2) //Stop order
        expect(order.reduceOnly).to.equal(reduceOnly)
        expect(order.stillValid).to.equal(true)
        expect(order.expiry).to.equal(expiry)
        expect(order.stopPrice.d).to.equal(stop_price)
        expect(order.limitPrice.d).to.equal(0)
        expect(order.orderSize.d).to.equal(size)
        expect(order.collateral.d).to.equal(collateral)
        expect(order.leverage.d).to.equal(leverage)
        expect(order.slippage.d).to.equal(slippage)
        expect(order.tipFee.d).to.equal(MINIMUM_FEE)
      })

      it("Should now execute that order", async function() {
        await lob.execute(index)
        var output = await CH.getPosition(BTC_Address, BobSW)
        expect(output.size.d).to.not.equal('0')
      })
    })

  })

})
