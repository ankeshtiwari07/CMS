import React from 'react'

// HUMAIN nav mark for the Payload admin (replaces Payload's hexagon). Compact
// teal rounded-square 'H' monogram from the brand wordmark.
export default function Icon() {
  return (
    <svg
      viewBox='0 0 32 32'
      role='img'
      aria-label='HUMAIN'
      xmlns='http://www.w3.org/2000/svg'
      style={{ width: 26, height: 26 }}
    >
      <rect width='32' height='32' rx='8' fill='#009688' />
      <path
        transform='translate(7.09 9.12)'
        fill='#ffffff'
        d='M14.8545 2.90108H2.96384V0.0326309H0V13.7556H2.96384V10.8708H14.8545V13.7556H17.8183V0.0326309H14.8545V2.91738V2.90108ZM2.96384 8.37722V5.39468H14.8545V8.37722H2.96384Z'
      />
    </svg>
  )
}
