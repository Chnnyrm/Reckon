import React from 'react'

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${size / 4}px`,
        background: '#FF7A1A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: `${size * 0.55}px`,
          color: '#000000',
          lineHeight: 1
        }}
      >
        R
      </span>
    </div>
  )
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}
      className="select-none"
    >
      <LogoMark size={size} />
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: `${size * 0.65}px`,
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          lineHeight: 1
        }}
      >
        Reckon
      </span>
    </div>
  )
}

export default Logo
