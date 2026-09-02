const DATABASE_NAME = 'the-library-collection'
const DATABASE_VERSION = 1
const BOOK_STORE = 'books'
const SHELF_NAME_KEY = 'the-library:shelf-names'

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(BOOK_STORE)) {
        const store = database.createObjectStore(BOOK_STORE, { keyPath: 'id' })
        store.createIndex('shelfId', 'shelfId', { unique: false })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function transact(mode, operation) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(BOOK_STORE, mode)
    const store = transaction.objectStore(BOOK_STORE)
    const request = operation(store)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function listLibraryBooks() {
  if (typeof indexedDB === 'undefined') return []
  return transact('readonly', (store) => store.getAll())
}

export async function saveLibraryBook(book) {
  if (typeof indexedDB === 'undefined') throw new Error('Local book storage is unavailable in this browser.')
  await transact('readwrite', (store) => store.put(book))
  return book
}

export async function removeLibraryBook(id) {
  if (typeof indexedDB === 'undefined') return
  await transact('readwrite', (store) => store.delete(id))
}

export function loadShelfNames() {
  try {
    return JSON.parse(localStorage.getItem(SHELF_NAME_KEY) || '{}')
  } catch {
    return {}
  }
}

export function saveShelfNames(names) {
  localStorage.setItem(SHELF_NAME_KEY, JSON.stringify(names))
}

export function titleFromFile(fileName) {
  return fileName
    .replace(/\.(pdf|epub)$/i, '')
    .replace(/(?:https?[-_:/.]*)?(?:www[-_.]*)?[a-z0-9-]+\.(?:com|org|net|io)\b/gi, ' ')
    .replace(/\b(?:download|ebook|free|pdf|epub)\b/gi, ' ')
    .replace(/[\[\](){}]/g, ' ')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Untitled Volume'
}
