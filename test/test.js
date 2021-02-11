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
      let PF = await ethers.getContractFactory("SmartWalletFactory");
      pf = await PF.deploy(lob.address)
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
      expect(output[6]).to.eq(owner.address)
    })

  })

  describe("Testing call and delegatecall", function() {

    it("Getting proxy contract", async function() {
      expect((await checkpx.owner())).to.equal(owner.address)
    })

    it("Deploying test contract", async function() {
      let TEST = await ethers.getContractFactory('Test')
      test = await TEST.deploy()
    })

    it("Testing call", async function() {
      await checkpx.executeCall(test.address, '0x27b7cf8548656c6c6f20576f726c6421207468697320697320612063616c6c2829000000')
    })

    //it("Testing delegate call", async function() {
    //  await checkpx.executeDelegateCall(test.address, '0x27b7cf8548656c6c6f20576f726c642120746869732069732064656c656761746563616c')
    //})

  })

  describe("Testing execution of limit orders", function() {

    it("Is limit order created?", async function() {
      var output = await lob.getLimitOrder(0)
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
