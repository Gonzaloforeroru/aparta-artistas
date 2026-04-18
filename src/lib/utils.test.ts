import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn()', () => {
  it('should merge classnames correctly', () => {
    const result = cn('px-2', 'py-1')
    expect(result).toBe('px-2 py-1')
  })

  it('should handle conditional classes', () => {
    const result = cn('px-2', false && 'py-1', 'text-sm')
    expect(result).toBe('px-2 text-sm')
  })

  it('should merge tailwind classes with conflict resolution', () => {
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('should handle empty inputs', () => {
    const result = cn('')
    expect(result).toBe('')
  })

  it('should handle multiple inputs with arrays', () => {
    const result = cn(['px-2', 'py-1'], 'text-sm')
    expect(result).toBe('px-2 py-1 text-sm')
  })
})
