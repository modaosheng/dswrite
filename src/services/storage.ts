// 定义类型
export interface Book {
  id: number
  title: string
  author: string
  tag: string
  cover: string
  volumeCount: number
  chapterCount: number
  wordCount: number
}

export interface Chapter {
  id: number
  bookId: number
  title: string
  content: string
  wordCount: number
  volume?: string
}

// 添加相关内容的接口
export interface Related {
  id: number
  bookId: number
  title: string
  content: string
  type: 'note' | 'character' | 'place' | 'item'  // 相关内容类型
  createTime: number
}

// 存储键名
const STORAGE_KEYS = {
  BOOKS: 'books',
  CHAPTERS: 'chapters',
  RELATED: 'related',
  BOOK_ID_COUNTER: 'bookIdCounter'
}

// 存储服务
export const storageService = {
  // 获取所有书籍
  getBooks(): Book[] {
    try {
      const books = uni.getStorageSync(STORAGE_KEYS.BOOKS)
      return books || []
    } catch (e) {
      console.error('获取书籍失败:', e)
      return []
    }
  },

  // 保存书籍
  saveBook(book: Omit<Book, 'id'>): Book {
    try {
      const books = this.getBooks()
      const id = this.getNextBookId()
      const newBook = { ...book, id }
      books.push(newBook)
      uni.setStorageSync(STORAGE_KEYS.BOOKS, books)
      return newBook
    } catch (e) {
      console.error('保存书籍失败:', e)
      throw e
    }
  },

  // 获取书籍详情
  getBook(id: number): Book | null {
    try {
      const books = this.getBooks()
      return books.find(b => b.id === id) || null
    } catch (e) {
      console.error('获取书籍详情失败:', e)
      return null
    }
  },

  // 更新书籍信息
  updateBook(book: Book): void {
    try {
      const books = this.getBooks()
      const index = books.findIndex(b => b.id === book.id)
      if (index > -1) {
        books[index] = book
        uni.setStorageSync(STORAGE_KEYS.BOOKS, books)
      }
    } catch (e) {
      console.error('更新书籍失败:', e)
      throw e
    }
  },

  // 获取书籍的所有章节
  getChapters(bookId: number): Chapter[] {
    try {
      console.log('Getting chapters for bookId:', bookId)
      const allChapters = uni.getStorageSync(STORAGE_KEYS.CHAPTERS) || {}
      console.log('All chapters from storage:', allChapters)
      
      if (!allChapters || !allChapters[bookId]) {
        console.log('No chapters found for book')
        return []
      }
      
      const bookChapters = allChapters[bookId]
      console.log('Found book chapters:', bookChapters)
      
      // 处理并迁移数据
      const migratedChapters = bookChapters.map((chapter: any) => {
        const migratedChapter: Chapter = {
          id: chapter.id,
          bookId: chapter.bookId,
          title: chapter.title,
          content: chapter.content || '',
          wordCount: chapter.wordCount || 0,
          volume: chapter.volume || undefined
        }
        return migratedChapter
      })
      
      // 如果有数据被迁移，保存回存储
      const hasChanges = migratedChapters.some((chapter: Chapter, index: number) => {
        const original = bookChapters[index]
        return !original.volume && chapter.volume === undefined
      })
      
      if (hasChanges) {
        console.log('Migrating chapter data...')
        allChapters[bookId] = migratedChapters
        uni.setStorageSync(STORAGE_KEYS.CHAPTERS, allChapters)
        console.log('Chapter data migrated')
      }
      
      return migratedChapters
    } catch (e) {
      console.error('获取章节失败:', e)
      return []
    }
  },

  // 获取单个章节
  getChapter(bookId: number, chapterId: number): Chapter | null {
    try {
      const chapters = this.getChapters(bookId)
      return chapters.find(c => c.id === chapterId) || null
    } catch (e) {
      console.error('获取���节详情失败:', e)
      return null
    }
  },

  // 保存章节
  saveChapter(chapter: Chapter): void {
    try {
      console.log('Starting saveChapter with data:', chapter)
      let allChapters = uni.getStorageSync(STORAGE_KEYS.CHAPTERS)
      console.log('Current allChapters:', allChapters)
      
      // 确保 allChapters 是一个对象
      if (!allChapters) {
        console.log('Initializing empty allChapters')
        allChapters = {}
      }
      
      // 确保 bookChapters 是一个数组
      if (!allChapters[chapter.bookId]) {
        console.log('Initializing empty book chapters array for bookId:', chapter.bookId)
        allChapters[chapter.bookId] = []
      }
      
      const bookChapters = allChapters[chapter.bookId]
      console.log('Current book chapters:', bookChapters)
      
      // 创建新的章节对象，确保包含所有字段
      const chapterToSave: Chapter = {
        id: chapter.id,
        bookId: chapter.bookId,
        title: chapter.title,
        content: chapter.content || '',
        wordCount: chapter.wordCount || 0,
        volume: chapter.volume || undefined
      }
      
      const index = bookChapters.findIndex((c: Chapter) => c.id === chapter.id)
      console.log('Found chapter index:', index)
      
      if (index > -1) {
        console.log('Updating existing chapter')
        // 保留现有的 volume 字段，如果新数据没有提供的话
        if (!chapterToSave.volume && bookChapters[index].volume) {
          chapterToSave.volume = bookChapters[index].volume
        }
        bookChapters[index] = chapterToSave
      } else {
        console.log('Adding new chapter')
        bookChapters.push(chapterToSave)
      }
      
      // 保存更新后的章节数据
      console.log('Saving chapters with data:', allChapters)
      uni.setStorageSync(STORAGE_KEYS.CHAPTERS, allChapters)
      
      const savedChapters = uni.getStorageSync(STORAGE_KEYS.CHAPTERS)
      console.log('Verified saved chapters:', savedChapters)
      console.log('Verified book chapters:', savedChapters[chapter.bookId])

      // 更新书籍信息
      const book = this.getBook(chapter.bookId)
      if (book) {
        console.log('Updating book info')
        book.chapterCount = bookChapters.length
        book.wordCount = bookChapters.reduce((total: number, c: Chapter) => total + c.wordCount, 0)
        
        // 计算分卷数量（只计算有效的分卷）
        const volumes = new Set(bookChapters
          .map((c: Chapter) => c.volume)
          .filter((v: string) => typeof v === 'string' && v.trim().length > 0)
        )
        console.log('Found volumes:', Array.from(volumes))
        book.volumeCount = volumes.size
        
        this.updateBook(book)
        console.log('Updated book info:', book)
      }
    } catch (e) {
      console.error('保存章节失败:', e)
      throw e
    }
  },

  // 获取下一个书籍ID
  getNextBookId(): number {
    try {
      let counter = uni.getStorageSync(STORAGE_KEYS.BOOK_ID_COUNTER) || 0
      counter++
      uni.setStorageSync(STORAGE_KEYS.BOOK_ID_COUNTER, counter)
      return counter
    } catch (e) {
      console.error('获取书籍ID失败:', e)
      return Date.now()
    }
  },

  // 获取相关内容列表
  getRelated(bookId: number): Related[] {
    try {
      const allRelated = uni.getStorageSync(STORAGE_KEYS.RELATED) || {}
      return allRelated[bookId] || []
    } catch (e) {
      console.error('获取相关内容失败:', e)
      return []
    }
  },

  // 保存相关内容
  saveRelated(related: Related): void {
    try {
      let allRelated = uni.getStorageSync(STORAGE_KEYS.RELATED) || {}
      
      if (!allRelated[related.bookId]) {
        allRelated[related.bookId] = []
      }
      
      const bookRelated = allRelated[related.bookId]
      const index = bookRelated.findIndex((r: Related) => r.id === related.id)
      
      if (index > -1) {
        bookRelated[index] = related
      } else {
        bookRelated.push(related)
      }
      
      allRelated[related.bookId] = bookRelated
      uni.setStorageSync(STORAGE_KEYS.RELATED, allRelated)
    } catch (e) {
      console.error('保存相关内容失败:', e)
      throw e
    }
  },

  // 添加删除章节方法
  deleteChapter(bookId: number, chapterId: number): void {
    try {
      let allChapters = uni.getStorageSync(STORAGE_KEYS.CHAPTERS)
      
      if (!allChapters || !allChapters[bookId]) {
        return
      }
      
      const bookChapters = allChapters[bookId]
      const index = bookChapters.findIndex((c: Chapter) => c.id === chapterId)
      
      if (index > -1) {
        // 删除章节
        bookChapters.splice(index, 1)
        allChapters[bookId] = bookChapters
        uni.setStorageSync(STORAGE_KEYS.CHAPTERS, allChapters)
        
        // 更新书籍信息
        const book = this.getBook(bookId)
        if (book) {
          book.chapterCount = bookChapters.length
          book.wordCount = bookChapters.reduce((total: number, c: Chapter) => total + c.wordCount, 0)
          
          // 重新计算分卷数量
          const volumes = new Set(bookChapters
            .map((c: Chapter) => c.volume)
            .filter((v: string) => typeof v === 'string' && v.trim().length > 0)
          )
          book.volumeCount = volumes.size
          
          this.updateBook(book)
        }
      }
    } catch (e) {
      console.error('删除章节失败:', e)
      throw e
    }
  }
} 