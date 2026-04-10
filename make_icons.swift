#!/usr/bin/env swift
import AppKit

func makeIcon(size: CGFloat, path: String) {
    let nsSize = NSSize(width: size, height: size)
    let image = NSImage(size: nsSize)
    image.lockFocus()

    NSColor(red: 238/255, green: 135/255, blue: 39/255, alpha: 1).setFill()
    NSBezierPath(roundedRect: NSRect(origin: .zero, size: nsSize),
                 xRadius: size * 0.18, yRadius: size * 0.18).fill()

    let font = NSFont.systemFont(ofSize: size * 0.62)
    let attrs: [NSAttributedString.Key: Any] = [.font: font]
    let str = NSAttributedString(string: "🎸", attributes: attrs)
    let strSize = str.size()
    str.draw(at: NSPoint(
        x: (size - strSize.width) / 2,
        y: (size - strSize.height) / 2 - size * 0.02
    ))

    image.unlockFocus()

    if let cgImg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) {
        let rep = NSBitmapImageRep(cgImage: cgImg)
        if let data = rep.representation(using: .png, properties: [:]) {
            try? data.write(to: URL(fileURLWithPath: path))
            print("\(URL(fileURLWithPath: path).lastPathComponent) 作成完了")
        }
    }
}

let dir = CommandLine.arguments.count > 1
    ? CommandLine.arguments[1]
    : FileManager.default.currentDirectoryPath

makeIcon(size: 192, path: "\(dir)/icon-192.png")
makeIcon(size: 512, path: "\(dir)/icon-512.png")
