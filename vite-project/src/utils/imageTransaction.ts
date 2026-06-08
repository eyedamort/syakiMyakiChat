import type { Transaction } from '@tiptap/pm/state'

export function transactionAffectsImages(transaction: Transaction): boolean {
  for (const step of transaction.steps) {
    const map = step.getMap()
    let affects = false

    map.forEach((oldStart, oldEnd, newStart, newEnd) => {
      if (newStart < newEnd) {
        transaction.doc.nodesBetween(newStart, newEnd, (node) => {
          if (node.type.name === 'image') affects = true
        })
      }

      if (oldStart < oldEnd) {
        transaction.before.nodesBetween(oldStart, oldEnd, (node) => {
          if (node.type.name === 'image') affects = true
        })
      }
    })

    if (affects) return true
  }

  return false
}
