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

    it("Proxy contract deployed", async function() {
      let PC = await ethers.getContractFactory("ProxyContract");
      pc = await PC.deploy()
    })

    it("Confirming owner of proxy contract", async function() {
      expect(await pc.owner()).to.equal(owner.address);
    })

  })

})
