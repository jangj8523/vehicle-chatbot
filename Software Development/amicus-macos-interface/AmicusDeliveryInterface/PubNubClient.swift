//
//  PubNubClient.swift
//  MicrosoftBotHack
//
//  Created by Santiago Gutierrez on 3/5/19.
//  Copyright © 2019 zent. All rights reserved.
//

import Foundation
import PubNub

class PubNubClient : NSObject {
    
    static let shared = PubNubClient()
    
    fileprivate var client: PubNub!
    
    override init() {
        super.init()
        
        let configuration = PNConfiguration(publishKey: "pub-c-08bc673e-b941-4909-9e97-3c388077baef", subscribeKey: "sub-c-e9df644a-3b9d-11e9-9010-ca52b265d058")
        self.client = PubNub.clientWithConfiguration(configuration)
        self.client.addListener(self)
        
        // Subscribe to demo channel with presence observation
        self.client.subscribeToChannels(["amicus_delivery"], withPresence: true)
    }
    
}

extension PubNubClient : PNObjectEventListener {
    
    func client(_ client: PubNub, didReceiveMessage message: PNMessageResult) {
        
        if let message = message.data.message as? NSString {
            PasteManager.shared.pasteWaitAndEnter(message)
        }
        
        print("Received message: \(message.data.message) on channel \(message.data.channel) " +
            "at \(message.data.timetoken)")
    }
    
}

