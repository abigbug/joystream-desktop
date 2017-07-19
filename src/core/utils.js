/**
 * Created by bedeho on 20/06/17.
 */

var TorrentInfo = require('joystream-node').TorrentInfo

var utils = module.exports = {}

// Poor way of doing peer list maintenance, but
// this is all we have without proper/reliable peer level events.
var refreshPeers = function(client, statuses) {

    // Peer Ids for peers we are getting status snapshot for
    var peerIdExits = {}

    // Tell client to either add new peer
    // based on status, or tell about new status
    // if it already exits
    for(var i in statuses) {

        var s = statuses[i]

        if(client.peerExits(s.pid)) {
            client.updatePeerPluginStatus(s.pid, s)
        } else {
            client.addPeer(s.pid, s)
        }

        // Mark as present
        peerIdExits[s.pid] = true
    }

    // Iterate old peer Ids and drop the ones whichpid
    // are not part of this new snapshot
    var oldPeerIds = client.allPeerIds()

    for(var i in oldPeerIds) {

        var oldPeerId = oldPeerIds[i]

        if(!peerIdExits[oldPeerId])
            client.removePeer(oldPeerId)
    }
}

utils.refreshPeers = refreshPeers

utils.getTorrentInfoFromFile = function getTorrentInfoFromFile (path) {
  if (typeof input !== 'string') throw new Error('input must be a string')

  return new TorrentInfo(path)
}
