//
//  ProgramWindow.swift
//  MicrosoftBotHack
//
//  Created by Santiago Gutierrez on 3/13/19.
//  Copyright © 2019 zent. All rights reserved.
//

import Foundation
import AppKit

class ProgramWindow: NSWindow {
    override func keyDown(with event: NSEvent) {
        super.keyDown(with: event)
        Swift.print("Caught a key down: \(event.keyCode)!")
    }
}
