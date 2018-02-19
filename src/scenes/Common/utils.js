/**
 * Created by bedeho on 13/02/2018.
 */

import {
  AlreadyStarted,
  CanStart,
  WalletNotReady,
  InsufficientFunds,
  InViable,
  Stopped
} from './ViabilityOfPaidDownloadingTorrent'
import {ViabilityOfPaidDownloadInSwarm} from '../../core/Torrent'

/**
 * Computes indexes of playable files.
 *
 *
 * @param torrentFiles {FileStorage}
 * @returns {Array}
 */
function indexesOfPlayableFiles(torrentFiles) {

  let playableIndexfiles = []

  for (var i = 0; i < torrentFiles.numFiles(); i++) {
    let fileName = torrentFiles.fileName(i)
    let fileExtension = fileName.split('.').pop()

    // Need a list of all the video extensions that render-media suport.
    if (fileExtension === 'mp4' ||
      fileExtension === 'wbm' ||
      fileExtension === 'mkv' ||
      fileExtension === 'avi' ||
      fileExtension === 'webm') {
      playableIndexfiles.push(i)
    }
  }

  return playableIndexfiles
}


/**
 * Computes viability of paid downloading on torrent
 *
 * @param state {String} - state of torrent
 * @param walletStarted {Boolean} - whether wallet has currently been started
 * @param balance {Number} -  (stats)
 * @returns {Stopped|AlreadyStarted|InViable|WalletNotReady|InsufficientFunds|CanStart}
 */
function computeViabilityOfPaidDownloadingTorrent(state, walletStarted, balance, viabilityOfPaidDownloadInSwarm) {
  
  if(state.startsWith("Active.DownloadIncomplete.Unpaid.Stopped"))
    return new Stopped()
  else if(state.startsWith("Active.DownloadIncomplete.Paid"))
    return new AlreadyStarted()
  else if(!(viabilityOfPaidDownloadInSwarm instanceof ViabilityOfPaidDownloadInSwarm.Viable))
    return new InViable(viabilityOfPaidDownloadInSwarm)
  else if(!walletStarted)
    return new WalletNotReady()
  else {
    
    // Here it must be that swarm is viable, by
    // test in prior step
    
    if(balance == 0) // <== fix later to be a more complex constraint
      return new InsufficientFunds(viabilityOfPaidDownloadInSwarm.estimate, balance)
    else
      return new CanStart(viabilityOfPaidDownloadInSwarm.suitableAndJoined, viabilityOfPaidDownloadInSwarm.estimate)
  }
}

export {
  indexesOfPlayableFiles,
  computeViabilityOfPaidDownloadingTorrent
}