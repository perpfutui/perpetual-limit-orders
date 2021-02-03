const { expect } = require("chai");

describe("Perpetual Limit Orders:", function() {

    beforeEach(async function() {
    [owner] = await ethers.getSigners()
  })

  describe("Deployment", function() {

    it("Limit Order Book deployed", async function() {
      let LOB = await ethers.getContractFactory("LimitOrderBook");
      lob = await LOB.deploy()
    })

    it("Proxy factory deployed", async function() {
      let PF = await ethers.getContractFactory("ProxyFactory");
      pf = await PF.deploy()
    })

  })

  describe("Creating proxy contract", function() {

    it("Spawning new proxy", async function() {
      await pf.spawn()
    })

    it("Logging address", async function() {
      proxy = await pf.getProxy(owner.address)
    })

    it("Checking proxy address", async function() {
      checkpx = await ethers.getContractAt('ProxyContract', proxy)
      expect(await checkpx.owner()).to.equal(owner.address)
    })

    it("Shouldn't be able to duplicate proxy contract", async function() {
      await expect(pf.spawn()).to.be.revertedWith('Already has proxy');
    })

  })

  describe("Testing limit order functions", function() {

    var limit_price = 0
    var position_size = 0
    var address = '0xe028CB3E566059A0a0D43b90eF011eA1399E29c8'
    var expiry = 0
    var leverage = 10

    it("Creating limit order", async function() {
      await lob.addLimitOrder(limit_price, position_size, expiry, leverage, address)
    })

    it("Confirming parameters of limit order stored within struct", async function() {
      var output = await lob.getLimitOrder(0)
      expect(output[0]).to.eq(limit_price)
      expect(output[1]).to.eq(position_size)
      expect(output[2]).to.eq(expiry)
      expect(output[3]).to.eq(leverage)
      expect(output[4]).to.eq(true)
      expect(output[5]).to.eq(address)
    })

  })

})
