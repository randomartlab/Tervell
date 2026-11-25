// 自动生成：packages/shared/src/config/brand.ts。
import SwiftUI

struct TervellBrandMark: View {
  static let accent = Color(red: 0.6470588235294118, green: 0.807843137254902, blue: 0.7686274509803922)
  var body: some View {
    GeometryReader { proxy in
      ZStack {
        FoldFace(face: 0).fill(Self.accent.opacity(1))
        FoldFace(face: 1).fill(Self.accent.opacity(0.62))
        FoldFace(face: 2).fill(Self.accent.opacity(1))
      }.frame(width: proxy.size.width, height: proxy.size.height)
    }.accessibilityHidden(true)
  }
  private struct FoldFace: Shape {
    let face: Int
    func path(in rect: CGRect) -> Path {
      var path = Path()
      switch face {
      case 0:
      path.move(to: CGPoint(x: 19, y: 43))
      path.addCurve(to: CGPoint(x: 36, y: 23), control1: CGPoint(x: 19, y: 32), control2: CGPoint(x: 25, y: 26))
      path.addLine(to: CGPoint(x: 79, y: 12))
      path.addCurve(to: CGPoint(x: 85, y: 17), control1: CGPoint(x: 83, y: 11), control2: CGPoint(x: 86, y: 13))
      path.addLine(to: CGPoint(x: 83, y: 27))
      path.addCurve(to: CGPoint(x: 69, y: 40), control1: CGPoint(x: 81, y: 35), control2: CGPoint(x: 77, y: 38))
      path.addLine(to: CGPoint(x: 31, y: 50))
      path.addCurve(to: CGPoint(x: 19, y: 60), control1: CGPoint(x: 24, y: 52), control2: CGPoint(x: 19, y: 56))
      path.closeSubpath()
      case 1:
      path.move(to: CGPoint(x: 19, y: 60))
      path.addCurve(to: CGPoint(x: 31, y: 50), control1: CGPoint(x: 19, y: 55), control2: CGPoint(x: 24, y: 52))
      path.addLine(to: CGPoint(x: 44, y: 47))
      path.addLine(to: CGPoint(x: 44, y: 83))
      path.addLine(to: CGPoint(x: 27, y: 68))
      path.addCurve(to: CGPoint(x: 19, y: 60), control1: CGPoint(x: 22, y: 64), control2: CGPoint(x: 19, y: 63))
      path.closeSubpath()
      case 2:
      path.move(to: CGPoint(x: 49, y: 47))
      path.addLine(to: CGPoint(x: 66, y: 57))
      path.addCurve(to: CGPoint(x: 75, y: 73), control1: CGPoint(x: 72, y: 60), control2: CGPoint(x: 75, y: 65))
      path.addLine(to: CGPoint(x: 75, y: 92))
      path.addCurve(to: CGPoint(x: 69, y: 95), control1: CGPoint(x: 75, y: 96), control2: CGPoint(x: 73, y: 97))
      path.addLine(to: CGPoint(x: 59, y: 89))
      path.addCurve(to: CGPoint(x: 49, y: 80), control1: CGPoint(x: 55, y: 86), control2: CGPoint(x: 52, y: 83))
      path.closeSubpath()
      default: break
      }
      return path.applying(CGAffineTransform(translationX: -3, y: -4).concatenating(CGAffineTransform(scaleX: rect.width / 100, y: rect.height / 100)))
    }
  }
}
