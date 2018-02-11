/**
 * Created by bedeho on 11/07/17.
 */

import {EventEmitter} from 'events'
var TorrentStatemachine = require('./Statemachine/Torrent')
import FileSegmentStreamFactory from './FileSegmentStreamFactory'
import Common from './Statemachine/Common'
import {deepInitialStateFromActiveState} from './Statemachine/DeepInitialState'

/**
 * Torrent
 *
 * Note: This is a bad library interface,
 * https://github.com/JoyStream/joystream-desktop/issues/665
 *
 * emits loaded({DeepInitialState}) -  torrent has been loaded with given state
 * emits viabilityOfPaidDownloadInSwarm({ViabilityOfPaidDownloadInSwarm})
 * emits buyerTerms({BuyerTerns}) - updated terms of client side
 * emits sellerTerms({SellerTerms}
 * emits torrentInfo({TorrentInfo}) - updated metadata
 * emits validPaymentReceived({ValidPAymentReceivedAlert})
 * emits paymentSent({PaymentSentAlert})
 * emits failedToMakeSignedContract({err , tx}) - when
 *
 * These two are not reliable, as they are based on
 * snapshots of plugin state at regular intervals.
 * The arrival & disappearance of peer plugins may be missed
 * in theory:
 * emits peerAdded({Peer}) - when peer plugin is first seens as present
 * emits peerRemoved({PID}) - when peer plugin is first seens as gone
 */
class Torrent extends EventEmitter {

  /**
   * {String} Current state of the state machine
   */
  state

  /**
   * {String}
   */
  infoHash

  /**
   * {String}
   */
  name

  /**
   * {String}
   */
  savePath

  /**
   * {Buffer?}
   */
  resumeData

  /**
   * {TorrentInfo}
   */
  torrentInfo

  /**
   * {joystream-node.TorrentStatus} The most recent status for this status
   */
  torrentStatusUpdate

  /**
   * {joystream-node.Torrent} joystream-node torrent
   */
  joystreamNodeTorrent

  /**
   * {SellerTerms}
   */
  sellerTerms

  /**
   * {BuyerTerms}
   */
  buyerTerms

  /**
   * {Map.<String, Peer>}
   */
  peers

  /**
   * {ViabilityOfPaidDownloadInSwarm}
   */
  viabilityOfPaidDownloadInSwarm

  /**
   * {FileSegmentStreamFactory} Current active file segment factory, only set iff
   * a stream has been started.
   *
   * NB: Only one allowed at a time
   */
  fileSegmentStreamFactory
  
  constructor(settings, privateKeyGenerator, publicKeyHashGenerator, contractGenerator, broadcastRawTransaction) {

    super()

    this.state = this._compositeStateAsString()
    this.infoHash = settings.infoHash
    this.name = settings.name
    this.savePath = settings.savePath
    this.resumeData = settings.resumeData
    this.torrentInfo = settings.torrentInfo
    this._deepInitialState = settings.deepInitialState
    
    // Check that compatibility in deepInitialState and {buyerTerms, sellerTerms},
    // and store terms on client
    if(Common.isDownloading(settings.deepInitialState)) {
    
      if(settings.extensionSettings.buyerTerms)
        this.buyerTerms = settings.extensionSettings.buyerTerms
      else
        throw Error('DownloadIncomplete state requires buyer terms')
    
    } else if(Common.isUploading(settings.deepInitialState)) {
    
      if(settings.extensionSettings.sellerTerms)
        this.sellerTerms = settings.extensionSettings.sellerTerms
      else
        throw Error('Uploading state requires seller terms')
    
    }
    
    this.joystreamNodeTorrent = null
    this.fileSegmentStreamFactory = null

    // Hooks for state machine
    this._privateKeyGenerator = privateKeyGenerator
    this._publicKeyHashGenerator = publicKeyHashGenerator
    this._contractGenerator = contractGenerator
    this._broadcastRawTransaction = broadcastRawTransaction

    // Hook into Machinajs state transitions in the machine
    TorrentStatemachine.on('transition', (data) => {

      // Check that the transition is on this torrent
      if (data.client != this)
        return

      // Get current state
      let stateString = this._compositeStateAsString()

      // Update public state
      this.state = stateString

      console.log('Torrent: ' + stateString)

      this.emit('state', stateString)
      this.emit(stateString, data)
    })
    
  }
  
  start() {
    this._submitInput('start')
  }

  stop() {
    this._submitInput('stop')
  }

  updateBuyerTerms(buyerTerms) {
    this._submitInput('updateBuyerTerms', buyerTerms)
  }

  updateSellerTerms(sellerTerms) {
    this._submitInput('updateSellerTerms', sellerTerms)
  }

  provideMissingBuyerTerms(buyerTerms) {
    this._submitInput('missingBuyerTermsProvided', buyerTerms)
  }

  startPaidDownload(peerSorter, fn) {

    /**
     * API HACK
     * https://github.com/JoyStream/joystream-desktop/issues/665
     */

    this._submitInput('startPaidDownload', peerSorter)
  }

  beginUpload(sellerTerms){
    this._submitInput('goToStartedUploading', sellerTerms)
  }

  endUpload() {
    this._submitInput('goToPassive')
  }

  /**
   * Create a stream factory
   * Only possible when active, and a stream not already active.
   *
   * @param fileIndex {Number} - index of file
   * @returns {FileSegmentStreamFactory}
   */
  createStreamFactory(fileIndex) {

    /**
     * API HACK
     * https://github.com/JoyStream/joystream-desktop/issues/665
     */

    if(!this.state.startsWith('Active'))
      throw Error('Cannot be done in current state')
    else if(this.fileSegmentStreamFactory)
      throw Error('A stream factory is already active')

    // Check that index of file is valid
    let numFiles = this.joystreamNodeTorrent.handle.torrentFile().files().numFiles()

    if(fileIndex >= numFiles)
      throw Error('Invalid file index, max index: ' + (numFiles - 1))

    // Determine
    let completed = this.state.startsWith('Active.FinishedDownloading')

    // Create factory and set
    this.fileSegmentStreamFactory = new FileSegmentStreamFactory(client.joystreamNodeTorrent, fileIndex, completed)

    return this.fileSegmentStreamFactory
  }

  /**
   * End stream
   */
  endStream() {

    if(!this.fileSegmentStreamFactory)
      throw Error('Cannot end a stream, none started')

    //this.fileSegmentStreamFactory.stop()

    this.fileSegmentStreamFactory = null
  }

  deepInitialState() {
    return deepInitialStateFromActiveState(this.state)
  }
  
  _addedToSession(torrent) {
    this._submitInput('', torrent)
  }
  
  _terminate(generateResumeData) {
    this._submitInput('terminate', generateResumeData)
  }

  _submitInput(...args) {
    TorrentStatemachine.queuedHandle(this, ...args)
  }

  _compositeStateAsString() {
    return TorrentStatemachine.compositeState(this)
  }

  _setViabilityOfPaidDownloadInSwarm(viabilityOfPaidDownloadInSwarm) {
    this.viabilityOfPaidDownloadInSwarm = viabilityOfPaidDownloadInSwarm
    this.emit('viabilityOfPaidDownloadInSwarm', viabilityOfPaidDownloadInSwarm)
  }

  _setBuyerTerms(terms) {
    this.buyerTerms = terms
    this.emit('buyerTerms' , terms)
  }

  _setSellerTerms(terms) {
    this.sellerTerms = terms
    this.emit('sellerTerms', terms)
  }

  _setResumeData(resumeData) {
    this.resumeData = resumeData
    this.emit('resumeData', resumeData)
  }

  _setTorrentInfo(torrentInfo) {
    this.torrentInfo = torrentInfo
    this.emit('torrentInfo', torrentInfo)
  }

  _setTorrentStatusUpdate(torrentStatusUpdate) {
    this.torrentStatusUpdate = torrentStatusUpdate
    this.emit('torrentStatusUpdate', torrentStatusUpdate)
  }

  _handleValidPaymentReceivedAlert(alert) {
    this.emit('validPaymentReceived', alert) // (alert.pid, alert.totalAmountPaid)
  }

  _handlePaymentSentAlert(alert) {
    this.emit('paymentSent', alert) // (alert.pid, alert.totalAmountPaid)
  }

  _lastPaymentReceived(alert) {
    // store ?? alert.settlementTx

    this.emit('lastPaymentReceived', alert)
  }

}


export default Torrent
