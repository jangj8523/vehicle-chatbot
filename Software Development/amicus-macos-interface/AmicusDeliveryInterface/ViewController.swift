//
//  ViewController.swift
//  MicrosoftBotHack
//
//  Created by Santiago Gutierrez on 3/5/19.
//  Copyright © 2019 zent. All rights reserved.
//

import Cocoa

class ViewController: NSViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        
        /*Timer.scheduledTimer(withTimeInterval: 2.0, repeats: false) { (timer) in
            print("Timer fired")
            let pasteBoard = NSPasteboard.general
            pasteBoard.clearContents()
            pasteBoard.writeObjects(["Hey! Just a test." as NSString])
            
            self.pasteWaitAndEnter()
        }*/

        // Do any additional setup after loading the view.
    }

    @IBAction func buttonPressed(_ sender: Any) {
        Timer.scheduledTimer(withTimeInterval: 5.0, repeats: false) { (timer) in
            PasteManager.shared.pasteWaitAndEnter("Hi Amicus!" as NSString)
        }
    }
    
    override var representedObject: Any? {
        didSet {
        // Update the view, if already loaded.
        }
    }

}
