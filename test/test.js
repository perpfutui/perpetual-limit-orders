const { expect } = require("chai");

describe("Perpetual Limit Orders:", function() {

    beforeEach(async function() {
    [owner] = await ethers.getSigners()
  })

  describe("Deployment", function() {

    it("Limit Order Book deployed", async function() {
      let LOB = await ethers.getContractFactory("LimitOrderBook");
      lob = await LOB.deploy()
      await lob.deployed()
      console.log('Limit Order Book', lob.address)
    })

    it("Proxy factory deployed", async function() {
      let PF = await ethers.getContractFactory("SmartWalletFactory");
      pf = await PF.deploy(lob.address)
      await pf.deployed()
      console.log('Proxy Contract Factory', pf.address)
    })

    it("Setting factory address for LOB", async function() {
      await lob.setFactory(pf.address)
      expect(await lob.factory()).to.equal(pf.address)
    })

  })

  describe("Creating SmartWallet contract", function() {

    it("Spawning new SmartWallet", async function() {
      await pf.spawn()
    })

    it("Logging address", async function() {
      proxy = await pf.getSmartWallet(owner.address)
    })

    it("Checking SmartWallet address", async function() {
      checkpx = await ethers.getContractAt('SmartWallet', proxy)
      expect(await checkpx.owner()).to.equal(owner.address)
    })

    it("Shouldn't be able to duplicate Smart Wallet contract", async function() {
      await expect(pf.spawn()).to.be.revertedWith('Already has smart wallet');
    })

  })

  describe("Testing limit order functions", function() {

    var limit_price = ethers.utils.parseUnits('50000',18)
    var position_size = ethers.utils.parseUnits('1',12) //0.000001 BTC (0.04) USDC
    var collateral = ethers.utils.parseUnits('40', 15) //0.04 USDC
    var address = '0x0f346e19F01471C02485DF1758cfd3d624E399B4'
    var expiry = 0
    var leverage = 10

    it("Creating limit order", async function() {
      await lob.addLimitOrder(address, {d: limit_price}, {d: position_size}, {d:collateral})
    })

    it("Confirming parameters of limit order stored within struct", async function() {
      var output = await lob.getLimitOrderPrices(0)
      expect(output[0].d).to.equal(limit_price)
    })

  })

  describe("Testing execution of limit orders", function() {

    it("Is limit order created?", async function() {
      var output = await lob.getLimitOrderPrices(0)
      expect(output).to.not.be.null
    })

    it("Trying to execute order 0", async function() {
      await lob.execute(0)
    })

    it("Should fail to execute order 0 second time", async function() {
      await expect(lob.execute(0)).to.be.revertedWith('No longer valid')
    })


  })

})
