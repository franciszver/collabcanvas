// Mock the firestore service module
jest.mock('../../services/firestore', () => ({
  shapesCollection: jest.fn(),
  shapeDoc: jest.fn(),
  documentsCollection: jest.fn(),
  documentDoc: jest.fn(),
  createShape: jest.fn(),
  updateShape: jest.fn(),
  deleteShape: jest.fn(),
  rectangleToShape: jest.fn(),
  shapeToRectangle: jest.fn(),
}))

import * as firestoreService from '../../services/firestore'

describe('firestore service', () => {
  it('exports shapesCollection function', () => {
    expect(typeof firestoreService.shapesCollection).toBe('function')
  })

  it('exports shapeDoc function', () => {
    expect(typeof firestoreService.shapeDoc).toBe('function')
  })

  it('exports documentsCollection function', () => {
    expect(typeof firestoreService.documentsCollection).toBe('function')
  })

  it('exports documentDoc function', () => {
    expect(typeof firestoreService.documentDoc).toBe('function')
  })

  it('exports createShape function', () => {
    expect(typeof firestoreService.createShape).toBe('function')
  })

  it('exports updateShape function', () => {
    expect(typeof firestoreService.updateShape).toBe('function')
  })

  it('exports deleteShape function', () => {
    expect(typeof firestoreService.deleteShape).toBe('function')
  })

  it('exports rectangleToShape function', () => {
    expect(typeof firestoreService.rectangleToShape).toBe('function')
  })

  it('exports shapeToRectangle function', () => {
    expect(typeof firestoreService.shapeToRectangle).toBe('function')
  })
})