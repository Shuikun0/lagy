#!/usr/bin/env swift
import AppKit
import Foundation

/// 用系统 Apple Color Emoji 渲染 📟（U+1F4DF）到 PNG（需在 macOS 上运行）。
/// 用法: swift scripts/render-ios-favicon.swift [输出路径]
/// 默认: <cwd>/public/favicon.png
let args = CommandLine.arguments
let emoji = "\u{1F4DF}"
let defaultOut = "public/favicon.png"
let outPath: String
if args.count >= 2 {
  outPath = (args[1] as NSString).expandingTildeInPath
} else {
  let cwd = FileManager.default.currentDirectoryPath
  outPath = (cwd as NSString).appendingPathComponent(defaultOut)
}

let px = 128
let size = NSSize(width: px, height: px)

guard
  let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: px,
    pixelsHigh: px,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
  )
else {
  fputs("无法创建位图\n", stderr)
  exit(1)
}

NSGraphicsContext.saveGraphicsState()
defer { NSGraphicsContext.restoreGraphicsState() }

guard let ctx = NSGraphicsContext(bitmapImageRep: rep) else {
  fputs("无法创建绘图上下文\n", stderr)
  exit(1)
}
NSGraphicsContext.current = ctx

NSColor.clear.set()
NSBezierPath(rect: NSRect(origin: .zero, size: size)).fill()

guard let emojiFont = NSFont(name: "Apple Color Emoji", size: 82) else {
  fputs("找不到 Apple Color Emoji 字体\n", stderr)
  exit(1)
}

let str = NSAttributedString(string: emoji, attributes: [.font: emojiFont])
let strSize = str.size()
let origin = NSPoint(
  x: floor((size.width - strSize.width) / 2),
  y: floor((size.height - strSize.height) / 2)
)
str.draw(at: origin)

guard let png = rep.representation(using: .png, properties: [:]) else {
  fputs("无法编码 PNG\n", stderr)
  exit(1)
}

do {
  try png.write(to: URL(fileURLWithPath: outPath))
} catch {
  fputs("\(error)\n", stderr)
  exit(1)
}
