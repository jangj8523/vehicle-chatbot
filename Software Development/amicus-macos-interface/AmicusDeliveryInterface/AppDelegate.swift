//
//  AppDelegate.swift
//  MicrosoftBotHack
//
//  Created by Santiago Gutierrez on 3/5/19.
//  Copyright © 2019 zent. All rights reserved.
//

import Cocoa

@NSApplicationMain
class AppDelegate: NSObject, NSApplicationDelegate {

    func applicationDidFinishLaunching(_ aNotification: Notification) {
        // Insert code here to initialize your application
        
        _ = PubNubClient.shared
    }

    func applicationWillTerminate(_ aNotification: Notification) {
        // Insert code here to tear down your application
    }


}

