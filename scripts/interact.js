var fs = require('fs')
const fetch = require("cross-fetch")

const owner = '0xCaD18E65F91471C533ee86b76BCe463978f593AA'

async function main() {

  const LOB_abi = JSON.parse(fs.readFileSync('./artifacts/contracts/LimitOrderBook.sol/LimitOrderBook.json')).abi
  const SWF_abi = JSON.parse(fs.readFileSync('./artifacts/contracts/SmartWallet.sol/SmartWalletFactory.json')).abi
  const SW_abi = JSON.parse(fs.readFileSync('./artifacts/contracts/SmartWallet.sol/SmartWallet.json')).abi
  const CH_abi = [
    {"type":"event","name":"LiquidationFeeRatioChanged","inputs":[{"type":"uint256","name":"liquidationFeeRatio","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"MarginChanged","inputs":[{"type":"address","name":"sender","internalType":"address","indexed":true},{"type":"address","name":"amm","internalType":"address","indexed":true},{"type":"int256","name":"amount","internalType":"int256","indexed":false},{"type":"int256","name":"fundingPayment","internalType":"int256","indexed":false}],"anonymous":false},{"type":"event","name":"MarginRatioChanged","inputs":[{"type":"uint256","name":"marginRatio","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"OwnershipTransferred","inputs":[{"type":"address","name":"previousOwner","internalType":"address","indexed":true},{"type":"address","name":"newOwner","internalType":"address","indexed":true}],"anonymous":false},{"type":"event","name":"Paused","inputs":[{"type":"address","name":"account","internalType":"address","indexed":false}],"anonymous":false},{"type":"event","name":"PositionAdjusted","inputs":[{"type":"address","name":"amm","internalType":"address","indexed":true},{"type":"address","name":"trader","internalType":"address","indexed":true},{"type":"int256","name":"newPositionSize","internalType":"int256","indexed":false},{"type":"uint256","name":"oldLiquidityIndex","internalType":"uint256","indexed":false},{"type":"uint256","name":"newLiquidityIndex","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"PositionChanged","inputs":[{"type":"address","name":"trader","internalType":"address","indexed":true},{"type":"address","name":"amm","internalType":"address","indexed":true},{"type":"uint256","name":"margin","internalType":"uint256","indexed":false},{"type":"uint256","name":"positionNotional","internalType":"uint256","indexed":false},{"type":"int256","name":"exchangedPositionSize","internalType":"int256","indexed":false},{"type":"uint256","name":"fee","internalType":"uint256","indexed":false},{"type":"int256","name":"positionSizeAfter","internalType":"int256","indexed":false},{"type":"int256","name":"realizedPnl","internalType":"int256","indexed":false},{"type":"int256","name":"unrealizedPnlAfter","internalType":"int256","indexed":false},{"type":"uint256","name":"badDebt","internalType":"uint256","indexed":false},{"type":"uint256","name":"liquidationPenalty","internalType":"uint256","indexed":false},{"type":"uint256","name":"spotPrice","internalType":"uint256","indexed":false},{"type":"int256","name":"fundingPayment","internalType":"int256","indexed":false}],"anonymous":false},{"type":"event","name":"PositionLiquidated","inputs":[{"type":"address","name":"trader","internalType":"address","indexed":true},{"type":"address","name":"amm","internalType":"address","indexed":true},{"type":"uint256","name":"positionNotional","internalType":"uint256","indexed":false},{"type":"uint256","name":"positionSize","internalType":"uint256","indexed":false},{"type":"uint256","name":"liquidationFee","internalType":"uint256","indexed":false},{"type":"address","name":"liquidator","internalType":"address","indexed":false},{"type":"uint256","name":"badDebt","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"PositionSettled","inputs":[{"type":"address","name":"amm","internalType":"address","indexed":true},{"type":"address","name":"trader","internalType":"address","indexed":true},{"type":"uint256","name":"valueTransferred","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"RestrictionModeEntered","inputs":[{"type":"address","name":"amm","internalType":"address","indexed":false},{"type":"uint256","name":"blockNumber","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"Unpaused","inputs":[{"type":"address","name":"account","internalType":"address","indexed":false}],"anonymous":false},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"addMargin","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"},{"type":"tuple","name":"_addedMargin","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"adjustPosition","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"address"}],"name":"candidate","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"closePosition","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"},{"type":"tuple","name":"_quoteAssetAmountLimit","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"contract IMultiTokenRewardRecipient"}],"name":"feePool","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}],"name":"getLatestCumulativePremiumFraction","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}],"name":"getMarginRatio","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"},{"type":"address","name":"_trader","internalType":"address"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct ClearingHouse.Position","components":[{"type":"tuple","name":"size","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]},{"type":"tuple","name":"margin","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"openNotional","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"lastUpdatedCumulativePremiumFraction","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]},{"type":"uint256","name":"liquidityHistoryIndex","internalType":"uint256"},{"type":"uint256","name":"blockNumber","internalType":"uint256"}]}],"name":"getPosition","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"},{"type":"address","name":"_trader","internalType":"address"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"positionNotional","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"unrealizedPnl","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}],"name":"getPositionNotionalAndUnrealizedPnl","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"},{"type":"address","name":"_trader","internalType":"address"},{"type":"uint8","name":"_pnlCalcOption","internalType":"enum ClearingHouse.PnlCalcOption"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"position","internalType":"struct ClearingHouse.Position","components":[{"type":"tuple","name":"size","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]},{"type":"tuple","name":"margin","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"openNotional","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"lastUpdatedCumulativePremiumFraction","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]},{"type":"uint256","name":"liquidityHistoryIndex","internalType":"uint256"},{"type":"uint256","name":"blockNumber","internalType":"uint256"}]}],"name":"getUnadjustedPosition","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"},{"type":"address","name":"_trader","internalType":"address"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"initMarginRatio","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"initialize","inputs":[{"type":"uint256","name":"_initMarginRatio","internalType":"uint256"},{"type":"uint256","name":"_maintenanceMarginRatio","internalType":"uint256"},{"type":"uint256","name":"_liquidationFeeRatio","internalType":"uint256"},{"type":"address","name":"_insuranceFund","internalType":"contract IInsuranceFund"},{"type":"address","name":"_trustedForwarder","internalType":"address"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"contract IInsuranceFund"}],"name":"insuranceFund","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"isTrustedForwarder","inputs":[{"type":"address","name":"forwarder","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"liquidate","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"},{"type":"address","name":"_trader","internalType":"address"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"liquidationFeeRatio","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"maintenanceMarginRatio","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"openInterestNotionalMap","inputs":[{"type":"address","name":"","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"openPosition","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"},{"type":"uint8","name":"_side","internalType":"enum ClearingHouse.Side"},{"type":"tuple","name":"_quoteAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_leverage","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_baseAssetAmountLimit","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"address"}],"name":"owner","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"pause","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"paused","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"payFunding","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"removeMargin","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"},{"type":"tuple","name":"_removedMargin","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"renounceOwnership","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setFeePool","inputs":[{"type":"address","name":"_feePool","internalType":"contract IMultiTokenRewardRecipient"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setLiquidationFeeRatio","inputs":[{"type":"tuple","name":"_liquidationFeeRatio","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setMaintenanceMarginRatio","inputs":[{"type":"tuple","name":"_maintenanceMarginRatio","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setOwner","inputs":[{"type":"address","name":"newOwner","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setWhitelist","inputs":[{"type":"address","name":"_whitelist","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"settlePosition","inputs":[{"type":"address","name":"_amm","internalType":"contract IAmm"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"address"}],"name":"trustedForwarder","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"unpause","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"updateOwner","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"string","name":"","internalType":"string"}],"name":"versionRecipient","inputs":[]}
  ]
  const AMM_abi = [
    {"type":"event","name":"CapChanged","inputs":[{"type":"uint256","name":"maxHoldingBaseAsset","internalType":"uint256","indexed":false},{"type":"uint256","name":"openInterestNotionalCap","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"FundingRateUpdated","inputs":[{"type":"int256","name":"rate","internalType":"int256","indexed":false},{"type":"uint256","name":"underlyingPrice","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"LiquidityChanged","inputs":[{"type":"uint256","name":"quoteReserve","internalType":"uint256","indexed":false},{"type":"uint256","name":"baseReserve","internalType":"uint256","indexed":false},{"type":"int256","name":"cumulativeNotional","internalType":"int256","indexed":false}],"anonymous":false},{"type":"event","name":"OwnershipTransferred","inputs":[{"type":"address","name":"previousOwner","internalType":"address","indexed":true},{"type":"address","name":"newOwner","internalType":"address","indexed":true}],"anonymous":false},{"type":"event","name":"ReserveSnapshotted","inputs":[{"type":"uint256","name":"quoteAssetReserve","internalType":"uint256","indexed":false},{"type":"uint256","name":"baseAssetReserve","internalType":"uint256","indexed":false},{"type":"uint256","name":"timestamp","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"Shutdown","inputs":[{"type":"uint256","name":"settlementPrice","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"SwapInput","inputs":[{"type":"uint8","name":"dir","internalType":"enum IAmm.Dir","indexed":false},{"type":"uint256","name":"quoteAssetAmount","internalType":"uint256","indexed":false},{"type":"uint256","name":"baseAssetAmount","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"SwapOutput","inputs":[{"type":"uint8","name":"dir","internalType":"enum IAmm.Dir","indexed":false},{"type":"uint256","name":"quoteAssetAmount","internalType":"uint256","indexed":false},{"type":"uint256","name":"baseAssetAmount","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"baseAssetReserve","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}],"name":"calcBaseAssetAfterLiquidityMigration","inputs":[{"type":"tuple","name":"_baseAssetAmount","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]},{"type":"tuple","name":"_fromQuoteReserve","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_fromBaseReserve","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"calcFee","inputs":[{"type":"tuple","name":"_quoteAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"address"}],"name":"candidate","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"fluctuationLimitRatio","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"fundingBufferPeriod","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"fundingPeriod","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"int256","name":"d","internalType":"int256"}],"name":"fundingRate","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}],"name":"getBaseAssetDelta","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}],"name":"getBaseAssetDeltaThisFundingPeriod","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}],"name":"getCumulativeNotional","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getInputPrice","inputs":[{"type":"uint8","name":"_dir","internalType":"enum IAmm.Dir"},{"type":"tuple","name":"_quoteAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"pure","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getInputPriceWithReserves","inputs":[{"type":"uint8","name":"_dir","internalType":"enum IAmm.Dir"},{"type":"tuple","name":"_quoteAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_quoteAssetPoolAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_baseAssetPoolAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getInputTwap","inputs":[{"type":"uint8","name":"_dir","internalType":"enum IAmm.Dir"},{"type":"tuple","name":"_quoteAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct IAmm.LiquidityChangedSnapshot","components":[{"type":"tuple","name":"cumulativeNotional","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]},{"type":"tuple","name":"quoteAssetReserve","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"baseAssetReserve","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"totalPositionSize","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}]}],"name":"getLatestLiquidityChangedSnapshots","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct IAmm.LiquidityChangedSnapshot","components":[{"type":"tuple","name":"cumulativeNotional","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]},{"type":"tuple","name":"quoteAssetReserve","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"baseAssetReserve","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"totalPositionSize","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}]}],"name":"getLiquidityChangedSnapshots","inputs":[{"type":"uint256","name":"i","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"getLiquidityHistoryLength","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getMaxHoldingBaseAsset","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getOpenInterestNotionalCap","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getOutputPrice","inputs":[{"type":"uint8","name":"_dir","internalType":"enum IAmm.Dir"},{"type":"tuple","name":"_baseAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"pure","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getOutputPriceWithReserves","inputs":[{"type":"uint8","name":"_dir","internalType":"enum IAmm.Dir"},{"type":"tuple","name":"_baseAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_quoteAssetPoolAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_baseAssetPoolAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getOutputTwap","inputs":[{"type":"uint8","name":"_dir","internalType":"enum IAmm.Dir"},{"type":"tuple","name":"_baseAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getReserve","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getSettlementPrice","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"getSnapshotLen","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getSpotPrice","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getTwapPrice","inputs":[{"type":"uint256","name":"_intervalInSeconds","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getUnderlyingPrice","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"getUnderlyingTwapPrice","inputs":[{"type":"uint256","name":"_intervalInSeconds","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"address"}],"name":"globalShutdown","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"initialize","inputs":[{"type":"uint256","name":"_quoteAssetReserve","internalType":"uint256"},{"type":"uint256","name":"_baseAssetReserve","internalType":"uint256"},{"type":"uint256","name":"_tradeLimitRatio","internalType":"uint256"},{"type":"uint256","name":"_fundingPeriod","internalType":"uint256"},{"type":"address","name":"_priceFeed","internalType":"contract IPriceFeed"},{"type":"bytes32","name":"_priceFeedKey","internalType":"bytes32"},{"type":"address","name":"_quoteAsset","internalType":"address"},{"type":"uint256","name":"_fluctuationLimitRatio","internalType":"uint256"},{"type":"uint256","name":"_tollRatio","internalType":"uint256"},{"type":"uint256","name":"_spreadRatio","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"nextFundingTime","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"open","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"address"}],"name":"owner","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"contract IPriceFeed"}],"name":"priceFeed","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"bytes32","name":"","internalType":"bytes32"}],"name":"priceFeedKey","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"contract IERC20"}],"name":"quoteAsset","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"quoteAssetReserve","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"renounceOwnership","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"quoteAssetReserve","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"baseAssetReserve","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"uint256","name":"timestamp","internalType":"uint256"},{"type":"uint256","name":"blockNumber","internalType":"uint256"}],"name":"reserveSnapshots","inputs":[{"type":"uint256","name":"","internalType":"uint256"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setCap","inputs":[{"type":"tuple","name":"_maxHoldingBaseAsset","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_openInterestNotionalCap","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setCounterParty","inputs":[{"type":"address","name":"_counterParty","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setFluctuationLimitRatio","inputs":[{"type":"tuple","name":"_fluctuationLimitRatio","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setGlobalShutdown","inputs":[{"type":"address","name":"_globalShutdown","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setOpen","inputs":[{"type":"bool","name":"_open","internalType":"bool"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setOwner","inputs":[{"type":"address","name":"newOwner","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setSpotPriceTwapInterval","inputs":[{"type":"uint256","name":"_interval","internalType":"uint256"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setSpreadRatio","inputs":[{"type":"tuple","name":"_spreadRatio","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setTollRatio","inputs":[{"type":"tuple","name":"_tollRatio","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"tuple","name":"","internalType":"struct SignedDecimal.signedDecimal","components":[{"type":"int256","name":"d","internalType":"int256"}]}],"name":"settleFunding","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"shutdown","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"spotPriceTwapInterval","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"spreadRatio","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"swapInput","inputs":[{"type":"uint8","name":"_dir","internalType":"enum IAmm.Dir"},{"type":"tuple","name":"_quoteAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_baseAssetAmountLimit","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"tuple","name":"","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]}],"name":"swapOutput","inputs":[{"type":"uint8","name":"_dir","internalType":"enum IAmm.Dir"},{"type":"tuple","name":"_baseAssetAmount","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"tuple","name":"_quoteAssetAmountLimit","internalType":"struct Decimal.decimal","components":[{"type":"uint256","name":"d","internalType":"uint256"}]},{"type":"bool","name":"_skipFluctuationCheck","internalType":"bool"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"tollAmount","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"tollRatio","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"int256","name":"d","internalType":"int256"}],"name":"totalPositionSize","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"d","internalType":"uint256"}],"name":"tradeLimitRatio","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"updateOwner","inputs":[]}]
  const ERC20_ABI = [
      {"type":"function","stateMutability":"view","payable":false,"outputs":[{"type":"bool","name":""}],"name":"mintingFinished","inputs":[],"constant":true},{"type":"function","stateMutability":"view","payable":false,"outputs":[{"type":"string","name":""}],"name":"name","inputs":[],"constant":true},{"type":"function","stateMutability":"nonpayable","payable":false,"outputs":[{"type":"bool","name":""}],"name":"approve","inputs":[{"type":"address","name":"_spender"},{"type":"uint256","name":"_value"}],"constant":false},{"type":"function","stateMutability":"nonpayable","payable":false,"outputs":[],"name":"setBridgeContract","inputs":[{"type":"address","name":"_bridgeContract"}],"constant":false},{"type":"function","stateMutability":"view","payable":false,"outputs":[{"type":"uint256","name":""}],"name":"totalSupply","inputs":[],"constant":true},{"type":"function","stateMutability":"nonpayable","payable":false,"outputs":[{"type":"bool","name":""}],"name":"transferFrom","inputs":[{"type":"address","name":"_sender"},{"type":"address","name":"_recipient"},{"type":"uint256","name":"_amount"}],"constant":false},{"type":"function","stateMutability":"view","payable":false,"outputs":[{"type":"bytes32","name":""}],"name":"PERMIT_TYPEHASH","inputs":[],"constant":true},{"type":"function","stateMutability":"view","payable":false,"outputs":[{"type":"uint8","name":""}],"name":"decimals","inputs":[],"constant":true},{"type":"function","stateMutability":"view","payable":false,"outputs":[{"type":"bytes32","name":""}],"name":"DOMAIN_SEPARATOR","inputs":[],"constant":true},{"type":"function","stateMutability":"nonpayable","payable":false,"outputs":[{"type":"bool","name":""}],"name":"increaseAllowance","inputs":[{"type":"address","name":"spender"},{"type":"uint256","name":"addedValue"}],"constant":false},{"type":"function","stateMutability":"nonpayable","payable":false,"outputs":[{"type":"bool","name":""}],"name":"transferAndCall","inputs":[{"type":"address","name":"_to"},{"type":"uint256","name":"_value"},{"type":"bytes","name":"_data"}],"constant":false},{"type":"function","stateMutability":"nonpayable","payable":false,"outputs":[{"type":"bool","name":""}],"name":"mint","inputs":[{"type":"address","name":"_to"},{"type":"uint256","name":"_amount"}],"constant":false},{"type":"function","stateMutability":"nonpayable","payable":false,"outputs":[],"name":"burn","inputs":[{"type":"uint256","name":"_value"}],"constant":false},{"type":"function","stateMutability":"view","payable":false,"outputs":[{"type":"string","name":""}],"name":"version","inputs":[],"constant":true},{"type":"function","stateMutability":"nonpayable","payable":false,"outputs":[{"type":"bool","name":""}],"name":"decreaseApproval","inputs":[{"type":"address","name":"_spender"},{"type":"uint256","name":"_subtractedValue"}],"constant":false},{"type":"function","stateMutability":"nonpayable","payable":false,"outputs":[],"name":"claimTokens","inputs":[{"type":"address","name":"_token"},{"type":"address","name":"_to"}],"constant":false},{"type":"function","stateMutability":"view","payable":false,"outputs":[{"type":"uint256","name":""}],"name":"balanceOf","inputs":[{"type":"address","name":"_owner"}],"constant":true},{"type":"function","stateMutability":"nonpayable","payable":false,"outputs":[],"name":"renounceOwnership","inputs":[],"constant":false},{"type":"function","stateMutability":"view","payable":false,"outputs":[{"type":"bool","name":""}],"name":"isBridge","inputs":[{"type":"address","name":"_address"}],"constant":true},{"type":"function","stateMutability":"nonpayable","payable":false,"outputs":[{"type":"bool","name":""}],"name":"finishMinting","inputs":[],"constant":false},{"type":"function","stateMutability":"view","payable":false,"outputs":[{"type":"uint256","name":""}],"name":"nonces","inputs":[{"type":"address","name":""}],"constant":true},{"type":"function","stateMutability":"pure","payable":false,"outputs":[{"type":"uint64","name":"major"},{"type":"uint64","name":"minor"},{"type":"uint64","name":"patch"}],"name":"getTokenInterfacesVersion","inputs":[],"constant":true},{"type":"function","stateMutability":"view","payable":false,"outputs":[{"type":"address","name":""}],"name":"owner","inputs":[],"constant":true},{"type":"function","stateMutability":"nonpayable","payable":false,"outputs":[],"name":"permit","inputs":[{"type":"address","name":"_holder"},{"type":"address","name":"_spender"},{"type":"uint256","name":"_nonce"},{"type":"uint256","name":"_expiry"},{"type":"bool","name":"_allowed"},{"type":"uint8","name":"_v"},{"type":"bytes32","name":"_r"},{"type":"bytes32","name":"_s"}],"constant":false},{"type":"function","stateMutability":"view","payable":false,"outputs":[{"type":"string","name":""}],"name":"symbol","inputs":[],"constant":true},{"type":"function","stateMutability":"nonpayable","payable":false,"outputs":[{"type":"bool","name":""}],"name":"decreaseAllowance","inputs":[{"type":"address","name":"spender"},{"type":"uint256","name":"subtractedValue"}],"constant":false},{"type":"function","stateMutability":"nonpayable","payable":false,"outputs":[{"type":"bool","name":""}],"name":"transfer","inputs":[{"type":"address","name":"_to"},{"type":"uint256","name":"_value"}],"constant":false},{"type":"function","stateMutability":"nonpayable","payable":false,"outputs":[],"name":"push","inputs":[{"type":"address","name":"_to"},{"type":"uint256","name":"_amount"}],"constant":false},{"type":"function","stateMutability":"nonpayable","payable":false,"outputs":[],"name":"move","inputs":[{"type":"address","name":"_from"},{"type":"address","name":"_to"},{"type":"uint256","name":"_amount"}],"constant":false},{"type":"function","stateMutability":"view","payable":false,"outputs":[{"type":"address","name":""}],"name":"bridgeContract","inputs":[],"constant":true},{"type":"function","stateMutability":"nonpayable","payable":false,"outputs":[{"type":"bool","name":""}],"name":"increaseApproval","inputs":[{"type":"address","name":"_spender"},{"type":"uint256","name":"_addedValue"}],"constant":false},{"type":"function","stateMutability":"view","payable":false,"outputs":[{"type":"uint256","name":""}],"name":"allowance","inputs":[{"type":"address","name":"_owner"},{"type":"address","name":"_spender"}],"constant":true},{"type":"function","stateMutability":"nonpayable","payable":false,"outputs":[],"name":"pull","inputs":[{"type":"address","name":"_from"},{"type":"uint256","name":"_amount"}],"constant":false},{"type":"function","stateMutability":"nonpayable","payable":false,"outputs":[],"name":"transferOwnership","inputs":[{"type":"address","name":"_newOwner"}],"constant":false},{"type":"function","stateMutability":"view","payable":false,"outputs":[{"type":"uint256","name":""}],"name":"expirations","inputs":[{"type":"address","name":""},{"type":"address","name":""}],"constant":true},{"type":"constructor","stateMutability":"nonpayable","payable":false,"inputs":[{"type":"string","name":"_name"},{"type":"string","name":"_symbol"},{"type":"uint8","name":"_decimals"},{"type":"uint256","name":"_chainId"}]},{"type":"event","name":"ContractFallbackCallFailed","inputs":[{"type":"address","name":"from","indexed":false},{"type":"address","name":"to","indexed":false},{"type":"uint256","name":"value","indexed":false}],"anonymous":false},{"type":"event","name":"Mint","inputs":[{"type":"address","name":"to","indexed":true},{"type":"uint256","name":"amount","indexed":false}],"anonymous":false},{"type":"event","name":"MintFinished","inputs":[],"anonymous":false},{"type":"event","name":"OwnershipRenounced","inputs":[{"type":"address","name":"previousOwner","indexed":true}],"anonymous":false},{"type":"event","name":"OwnershipTransferred","inputs":[{"type":"address","name":"previousOwner","indexed":true},{"type":"address","name":"newOwner","indexed":true}],"anonymous":false},{"type":"event","name":"Burn","inputs":[{"type":"address","name":"burner","indexed":true},{"type":"uint256","name":"value","indexed":false}],"anonymous":false},{"type":"event","name":"Transfer","inputs":[{"type":"address","name":"from","indexed":true},{"type":"address","name":"to","indexed":true},{"type":"uint256","name":"value","indexed":false},{"type":"bytes","name":"data","indexed":false}],"anonymous":false},{"type":"event","name":"Approval","inputs":[{"type":"address","name":"owner","indexed":true},{"type":"address","name":"spender","indexed":true},{"type":"uint256","name":"value","indexed":false}],"anonymous":false},{"type":"event","name":"Transfer","inputs":[{"type":"address","name":"from","indexed":true},{"type":"address","name":"to","indexed":true},{"type":"uint256","name":"value","indexed":false}],"anonymous":false}]

  const ERC20encode = new ethers.utils.Interface(ERC20_ABI)


  const xDaiUrl = "https://rpc.xdaichain.com/"
  //const xDaiUrl = "https://dai.poa.network/"

  const provider = new ethers.providers.JsonRpcProvider(xDaiUrl)
  const wallet = new ethers.Wallet('3e730129b3867804afd27b530749d49113164a349b05879f536b6d4fe9018a9f').connect(provider)

  const LOB_address = '0xB7dEE432D550B98754715f540Bf950457490dC9D'
  const SWF_address = '0x4518C76B7e41C18cB7e0Aed709a883dCB87f8C3F'
  const url = "https://metadata.perp.exchange/production.json"
  metadata = await fetch(url).then(res => res.json())

  const CH_address = metadata.layers.layer2.contracts.ClearingHouse.address

  var contracts = metadata.layers.layer2.contracts
  amms = []
  for(var contract in contracts) {
    if(contracts[contract].name=='Amm'){
      var obj = {
        asset: contract.substr(0,contract.length-4),
        amm: contracts[contract].address
      }
      amms.push(obj)
    }
  }

  const LOB = new ethers.Contract(LOB_address, LOB_abi, wallet)
  const SWF = new ethers.Contract(SWF_address, SWF_abi, wallet)

  proxy_address = await SWF.getSmartWallet(owner)
  const proxy = new ethers.Contract(proxy_address, SW_abi, wallet)
  const CHencode = new ethers.utils.Interface(CH_abi)
  const CH = new ethers.Contract(CH_address, CH_abi, wallet)
  const SW = new ethers.Contract(proxy_address, SW_abi, wallet)
  const USDC = new ethers.Contract(metadata.layers.layer2.externalContracts.usdc, ERC20_ABI, wallet )
  const SNX = new ethers.Contract(metadata.layers.layer2.contracts.SNXUSDC.address, AMM_abi, wallet)

  /*
    IGNORE EVERYTHING ABOVE HERE
  */

console.log('Proxy contract: %s', proxy_address)
console.log('Balance: $%s', ethers.utils.formatUnits(await USDC.balanceOf(proxy_address),6))

/*
var func = CHencode.encodeFunctionData('openPosition(address,uint8,(uint256),(uint256),(uint256))',
[metadata.layers.layer2.contracts.SNXUSDC.address,
0,
{d: ethers.utils.parseUnits('1', 16)}, //margin in cents
{d: ethers.utils.parseUnits('1', 18)}, //leverage
{d: '0'} ])
console.log('Sending tx with calldata:', func)
*/

// await proxy.executeCall(CH_address, func, {gasLimit:1000000})
//   .then(async result => console.log(await result.wait()))

var limit_price = ethers.utils.parseUnits('21.15',18)
var position_size = ethers.utils.parseUnits('0.001',18)
var collat = limit_price.mul(position_size).div('1000000000000000000')
var lev = ethers.utils.parseUnits('1', 18)
var slippage = ethers.utils.parseUnits('0.001',18)

/*
await LOB.addLimitOrder(
  metadata.layers.layer2.contracts.SNXUSDC.address,
  {d: limit_price},
  {d: position_size},
  {d: collat},
  {d: lev},
  {d: slippage},
  {d: ethers.utils.parseUnits('0.001',18)},
  false,
  0
).then(async result => console.log(await result.wait()))


await LOB.execute(1)
.then(async result => console.log(await result.wait()))
*/
/*
await LOB.addTrailingStopMarketOrderPct(
  metadata.layers.layer2.contracts.SNXUSDC.address,
  {d: ethers.utils.parseUnits('0.1', 18)}, //10%
  {d: ethers.utils.parseUnits('-0.001',18)},
  {d: collat},
  {d: ethers.utils.parseUnits('2', 18)},
  {d: '0'},
  {d: ethers.utils.parseUnits('0.001',18)},
  true,
  0
)
*/

//await LOB.pokeContract(2, 60449, {gasLimit: 1000000})
// .then(async result => console.log(await result.wait()))

await LOB.getLimitOrder(2)
  .then(result => {
    console.log(result.stopPrice.d.toString())
  })

  await LOB.getTrailingData(2)
    .then(result => {
      console.log(result.witnessPrice.d.toString())
      console.log(result.snapshotLastUpdated.toString())

    })


//witnessed 20.8
//this is a trailing sell
//therefore sell at 20.8 - 10%
//new price, 20.6

for(var i=60442; i<60462; i++){

await LOB.getPriceAtSnapshot(
  metadata.layers.layer2.contracts.SNXUSDC.address, i
).then( res => console.log(i, res.toString()))

}

/*
var func = CHencode.encodeFunctionData('closePosition(address,(uint256))',
[metadata.layers.layer2.contracts.SNXUSDC.address,
{d: 0}])
await proxy.executeCall(CH_address, func)
.then(async result => console.log(await result.wait()))
*/
await displayOrders(LOB)

CH.getPosition(metadata.layers.layer2.contracts.SNXUSDC.address, proxy_address).then( pos =>
     console.log('Position size: %s %s ', truncate(ethers.utils.formatUnits(pos.size.d),15), 'SNX')
)

}

console.clear()
main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

async function displayTrades(SW) {
  var filterx = SW.filters.OpenPosition()
  await SW.queryFilter(filterx).then((result) => {
    result.forEach(out => {
      out.getBlock().then( blk => {
        console.log('%s %s on %s',
          out.args.dir.toNumber() == 0 ? 'Bought' : 'Sold',
          (amms.find(amm => amm.amm==out.args.asset)).asset,
          new Date(1000*blk.timestamp).toISOString()
        )
      })
      console.log()
    })
  })
}

ordertype = []
ordertype[0] = 'Market'
ordertype[1] = 'Limit'
ordertype[2] = 'Stop Market'
ordertype[3] = 'Stop Limit'
ordertype[4] = 'Trailing Stop Market'
ordertype[5] = 'Trailing Stop Limit'


async function displayOrders(LOB) {

  var filter = LOB.filters.OrderCreated(owner)
  let events = await LOB.queryFilter(filter)

  Promise.all(
    events.map(async function(event) {
      return await LOB.getLimitOrder(event.args.order_id).then( order => {
        if(order.stillValid){
          console.log('Displaying info for order#', event.args.order_id.toNumber())
          console.log('Asset:',(amms.find(amm => amm.amm==order.asset)).asset)
          console.log('Order type:',ordertype[order.orderType],ethers.utils.formatUnits(order.orderSize.d)>0?'Buy':'Sell')
          if(order.orderType == 1 || order.orderType == 3 ) {
            console.log('Limit price:',ethers.utils.formatUnits(order.limitPrice.d))
          }
          if(order.orderType == 2 || order.orderType == 3 ) {
            console.log('Stop trigger price:',ethers.utils.formatUnits(order.stopPrice.d))
          }
          console.log('Order size:', ethers.utils.formatUnits(order.orderSize.d))
          console.log('-----------------')
        }
      })
    })
  )

}

async function displayPositions(CH) {
  Promise.all(
    amms.map(async function(amm) {
      return CH.getPosition(amm.amm, proxy_address).then( pos =>
        console.log('Position size: %s %s ', truncate(ethers.utils.formatUnits(pos.size.d),15), amm.asset)
      )
    })
  )

}

function truncate(str, maxDecimalDigits) {
    if (str.includes('.')) {
        const parts = str.split('.');
        return parts[0] + '.' + parts[1].slice(0, maxDecimalDigits);
    }
    return str;
}

async function giveMeTheLoot(USDC, ERC20encode, proxy) {
  var bal = await USDC.balanceOf(proxy_address)
  var func = ERC20encode.encodeFunctionData(
    'transfer(address,uint256)',
    [owner,bal])
  await proxy.executeCall(metadata.layers.layer2.externalContracts.usdc, func)
  .then( async result => console.log(await result.wait()))
}

async function sendOpenPosition(_AMM, _DIR, _COL, _LEV, _SLIP) {

  var func = CHencode.encodeFunctionData('openPosition(address,uint8,(uint256),(uint256),(uint256))',
  [_AMM,
  _DIR,
  _COL, //margin in cents
  _LEV, //leverage
  _SLIP])
  var tx = await proxy.executeCall(CH_address, func)
  var logs = await tx.wait()
  console.log('Transaction mined at ', logs.transactionHash)
}



/*var createLimitOrder = await LOB.addLimitOrder(
    (amms.find(amm => amm.asset=='SNX')).amm,
    {d: ethers.utils.parseUnits('25', 18)},     //STOP
    {d: ethers.utils.parseUnits('10', 14)},      //POS SIZE, 0.001
    {d: ethers.utils.parseUnits('29', 14)},     //COLLATERAL 0.0030
    {d: ethers.utils.parseUnits('10', 18)}, //max leverage
    {d: "0"}, //slippage
    {d: ethers.utils.parseUnits('1', 17)},   // tip Fee
    false,      //reduce only
    0           //expiry
  )
  var CLO = await createLimitOrder.wait()
  console.log(CLO.transactionHash)
*/
//await LOB.execute(1, {gasLimit:1000000})
//  .then( result => console.log(await result.wait()))


/*
var func = ERC20encode.encodeFunctionData (
  'approve(address,uint256)',
  [LOB_address,'115792089237316195423570985008687907853269984665640564039457584007913129639935'])
var tx = await proxy.executeCall(metadata.layers.layer2.externalContracts.usdc, func)
var logs = await tx.wait()
*/
/*

  var func = CHencode.encodeFunctionData('openPosition(address,uint8,(uint256),(uint256),(uint256))',
  [BTC_AMM,
  1,
  {d: ethers.utils.parseUnits('1', 16)}, //margin in cents
  {d: ethers.utils.parseUnits('1', 18)}, //leverage
  {d: 0}])
  console.log(func)
  var tx = await proxy.executeCall(CH_address, func)
  var logs = await tx.wait()
  console.log('Transaction mined at ', logs.transactionHash)

//console.log(CHencode)

var func = CHencode.encodeFunctionData('closePosition(address,(uint256))',
[BTC_AMM,
{d: 0}])
console.log(func)
*/
//var tx = await proxy.executeCall(CH_address, func)
//var logs = await tx.wait()
//console.log('Transaction mined at ', logs.transactionHash)
/*
var price = await BTC.getOutputPrice(0, {d: ethers.utils.parseUnits('1',18)})
console.log(ethers.utils.formatUnits(price.d))

price = await BTC.getOutputPrice(1, {d: ethers.utils.parseUnits('1',18)})
console.log(ethers.utils.formatUnits(price.d))
*/


/*
await LOB.addTrailingStopLimitOrderAbs(
  '0x0f346e19F01471C02485DF1758cfd3d624E399B4',
  {d: ethers.utils.parseUnits('5000',18)},
  {d: ethers.utils.parseUnits('1000',18)},
  {d: ethers.utils.parseUnits('-1',18)},
  {d: ethers.utils.parseUnits('15000',18)},
  {d: ethers.utils.parseUnits('4',18)},
  {d: '0'},
  {d: '0'},
  false,
  0
).then(async result => console.log(await result.wait()))
*/

//const BTC = new ethers.Contract(metadata.layers.layer2.contracts.BTCUSDC.address, AMM_abi, wallet)

/*
await LOB.getTrailingData(0).then(td => {
  console.log('Order created with snapshot %s',td.snapshotCreated.toNumber())
  console.log('Order last updated snapshot %s', td.snapshotLastUpdated.toNumber())
})
*/
/*
for (var i = 106952; i < 106957; i++) {
  var price = await BTC.reserveSnapshots(i).then(data => {
    return (data.quoteAssetReserve.d.div(data.baseAssetReserve.d)).toNumber()
  })
  console.log(i, price)
}*/
/*
106930 57011
106931 57024
106932 57034
106933 57049
106934 57056
106935 57069 --
106936 57081
106937 57089
106938 57099
106939 57110

106942 57100
106943 57081
106944 57020

106952 57086
106953 57099
106954 57111
106955 57062
106956 57197
*/

//DO 106845
/*
await LOB.pokeContract(0, 106955, {gasLimit: 100000})
  .then(async result => console.log(await result.wait()))
*/
/*
await LOB.getLimitOrder(0)
  .then(result => {
    console.log('Trailing stop price: %s', ethers.utils.formatUnits(result.stopPrice.d))
    console.log('Trailing limit price: %s', ethers.utils.formatUnits(result.limitPrice.d))
  })
*/
/*
  console.log('')
  console.log('Running tests..')
  console.log('User smart wallet: ',proxy_address)
  console.log('Balance: $%s', truncate(ethers.utils.formatUnits(await USDC.balanceOf(proxy_address),6),5))

  console.log('')
  console.log('')
  console.log('TRADE HISTORY')

  await displayTrades(SW)
  setTimeout(() => {
    console.log('')
    console.log('')
    console.log('PENDING ORDERS')
    console.log('')
    displayOrders(LOB)
  }, 2000)
  setTimeout(() => {
    console.log('')
    console.log('')
    console.log('OPEN POSITIONS')
    console.log('')
    displayPositions(CH) }, 4000)
*/
//giveMeTheLoot(USDC, ERC20encode, proxy)
