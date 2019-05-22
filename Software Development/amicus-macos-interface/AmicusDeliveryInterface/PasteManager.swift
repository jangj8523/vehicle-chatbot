//
//  PasteManager.swift
//  MicrosoftBotHack
//
//  Created by Santiago Gutierrez on 3/5/19.
//  Copyright © 2019 zent. All rights reserved.
//

import Foundation
import AppKit

class PasteManager : NSObject {
    
    static let shared = PasteManager()
    
    func copy(_ message: NSString) {
        let pasteBoard = NSPasteboard.general
        pasteBoard.clearContents()
        pasteBoard.writeObjects([message])
    }
    
    func pasteWaitAndEnter(_ message: NSString) {
        copy(message)
        
        self.paste()
        Timer.scheduledTimer(withTimeInterval: 0.5, repeats: false) { (timer) in
            self.enter()
        }
    }
    
    func paste () {
        print("paste()")
        simulateKeyPress(0x09, CGEventFlags.maskCommand)
    }
    
    func enter() {
        print("enter()")
        let code: UInt16 = 36
        simulateKeyPress(code, CGEventFlags.maskShift)
    }
    
}

extension PasteManager {
    
    fileprivate func simulateKeyPress(_ key: CGKeyCode, _ flags: CGEventFlags? = nil) {
        let src = CGEventSource(stateID: CGEventSourceStateID.hidSystemState)
        if let keyDown = CGEvent(keyboardEventSource: src, virtualKey: key, keyDown: true) { // cmd-v down
            if let flags = flags {
                keyDown.flags = flags
            }
            keyDown.post(tap: CGEventTapLocation.cghidEventTap)
        }
        
        if let keyUp = CGEvent(keyboardEventSource: src, virtualKey: key, keyDown: false) { // cmd-v up
            if let flags = flags {
                keyUp.flags = flags
            }
            keyUp.post(tap: CGEventTapLocation.cghidEventTap)
        }
    }
    
}
