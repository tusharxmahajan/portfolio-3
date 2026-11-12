// Brand logos for the hero ticker, in display order.
// Every file is white-only and drawn in the same 90-unit-tall box, with the mark optically
// sized inside it — so they all render at one CSS height. width/height are the file's own
// size (they reserve the right space before each image loads).
import adani from '../../assets/logos/adani.svg'
import bajaj from '../../assets/logos/bajaj.svg'
import cleartrip from '../../assets/logos/cleartrip.svg'
import croma from '../../assets/logos/croma.svg'
import dice from '../../assets/logos/dice.svg'
import dtdc from '../../assets/logos/dtdc.svg'
import flipkart from '../../assets/logos/flipkart.png'
import idfcFirstBank from '../../assets/logos/idfc-first-bank.svg'
import lenskart from '../../assets/logos/lenskart.svg'
import makeMyTrip from '../../assets/logos/makemytrip.svg'
import pineLabs from '../../assets/logos/pine-labs.svg'
import pwc from '../../assets/logos/pwc.svg'
import tata from '../../assets/logos/tata.svg'
import upstox from '../../assets/logos/upstox.svg'
import veritas from '../../assets/logos/veritas.svg'
import yesBank from '../../assets/logos/yes-bank.svg'
import zaggle from '../../assets/logos/zaggle.svg'
import zeeMedia from '../../assets/logos/zee-media.svg'

export const LOGOS = [
  { name: 'Cleartrip', src: cleartrip, width: 201, height: 90 },
  { name: 'Flipkart', src: flipkart, width: 341, height: 180 }, // raster, 2px per unit
  { name: 'Bajaj', src: bajaj, width: 206, height: 90 },
  { name: 'Tata', src: tata, width: 175, height: 90 },
  { name: 'Croma', src: croma, width: 186, height: 90 },
  { name: 'Lenskart', src: lenskart, width: 276, height: 90 },
  { name: 'Zee Media', src: zeeMedia, width: 158, height: 90 },
  { name: 'Adani', src: adani, width: 140, height: 90 },
  { name: 'Veritas', src: veritas, width: 183, height: 90 },
  { name: 'DTDC', src: dtdc, width: 167, height: 90 },
  { name: 'PwC', src: pwc, width: 115, height: 90 },
  { name: 'Zaggle', src: zaggle, width: 188, height: 90 },
  { name: 'IDFC First Bank', src: idfcFirstBank, width: 147, height: 90 },
  { name: 'Pine Labs', src: pineLabs, width: 162, height: 90 },
  { name: 'Yes Bank', src: yesBank, width: 239, height: 90 },
  { name: 'MakeMyTrip', src: makeMyTrip, width: 281, height: 90 },
  { name: 'Upstox', src: upstox, width: 154, height: 90 },
  { name: 'Dice', src: dice, width: 129, height: 90 },
]
