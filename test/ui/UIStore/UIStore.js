
// babel-polyfill for generator (async/await)
import 'babel-polyfill'

import Application from '../../../src/core/Application'
import UIStore from '../../../src/scenes/UIStore'
import MockApplication from './MockApplication'
var expect = require('chai').expect

describe('UIStore', function() {
  
  let mockApplication, uiStore
  
  it('is constructible', function () {
    
    mockApplication = new MockApplication(Application.STATE.STOPPED)
    uiStore = new UIStore(mockApplication)
    
    expect(uiStore.currentPhase).to.be.equal(UIStore.PHASE.Idle)
    expect(uiStore.totalRevenueFromPieces).to.be.equal(0)
    expect(uiStore.numberOfPiecesSoldAsSeller).to.be.equal(0)
    expect(uiStore.totalSpendingOnPieces).to.be.equal(0)
    
    /// Assert uiStore.applicationStore state
  
  })
  
  it('can be started', function() {
    
    mockApplication.updateState(Application.STATE.STARTING)
    
  })
  
  it('handle wallet started', function() {
    // Later
  })
  
  it('torrent added', function() {
    // Later
  })
  
  it('torrent removed', function() {
    // Later
  })
  
  it('can be stopped', function() {
    // Later
  })
  
})