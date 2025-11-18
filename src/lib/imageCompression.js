/**
 * 이미지 압축 유틸리티
 * 업로드 전에 이미지를 자동으로 압축하여 파일 크기를 줄입니다.
 */

/**
 * 이미지 파일을 압축합니다
 * @param {File} file - 압축할 이미지 파일
 * @param {Object} options - 압축 옵션
 * @param {number} options.maxSizeMB - 최대 파일 크기 (MB)
 * @param {number} options.maxWidthOrHeight - 최대 가로/세로 크기 (px)
 * @param {number} options.quality - 이미지 품질 (0-1)
 * @returns {Promise<File>} 압축된 이미지 파일
 */
export async function compressImage(file, options = {}) {
  const {
    maxSizeMB = 2, // 최대 2MB
    maxWidthOrHeight = 1920, // 최대 1920px
    quality = 0.8 // 80% 품질
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // Canvas 생성
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // 크기 조정
        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = (height * maxWidthOrHeight) / width
            width = maxWidthOrHeight
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = (width * maxWidthOrHeight) / height
            height = maxWidthOrHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // 이미지 그리기
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Blob으로 변환
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('이미지 압축 실패'))
              return
            }

            // 파일 크기 확인
            const fileSizeMB = blob.size / 1024 / 1024
            
            if (fileSizeMB > maxSizeMB) {
              // 품질을 더 낮춰서 재시도
              const newQuality = quality * (maxSizeMB / fileSizeMB) * 0.9
              
              canvas.toBlob(
                (newBlob) => {
                  if (!newBlob) {
                    reject(new Error('이미지 압축 실패'))
                    return
                  }

                  // File 객체 생성
                  const compressedFile = new File(
                    [newBlob],
                    file.name,
                    {
                      type: file.type || 'image/jpeg',
                      lastModified: Date.now()
                    }
                  )

                  console.log('이미지 압축 완료:', {
                    원본: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
                    압축: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
                    압축률: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`
                  })

                  resolve(compressedFile)
                },
                file.type || 'image/jpeg',
                Math.max(0.1, newQuality)
              )
            } else {
              // File 객체 생성
              const compressedFile = new File(
                [blob],
                file.name,
                {
                  type: file.type || 'image/jpeg',
                  lastModified: Date.now()
                }
              )

              console.log('이미지 압축 완료:', {
                원본: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
                압축: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
                압축률: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`
              })

              resolve(compressedFile)
            }
          },
          file.type || 'image/jpeg',
          quality
        )
      }

      img.onerror = () => {
        reject(new Error('이미지 로드 실패'))
      }

      img.src = e.target.result
    }

    reader.onerror = () => {
      reject(new Error('파일 읽기 실패'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * 파일이 이미지인지 확인합니다
 * @param {File} file - 확인할 파일
 * @returns {boolean} 이미지 여부
 */
export function isImageFile(file) {
  return file && file.type.startsWith('image/')
}

/**
 * 파일 크기를 MB 단위로 반환합니다
 * @param {File} file - 파일
 * @returns {number} 파일 크기 (MB)
 */
export function getFileSizeMB(file) {
  return file.size / 1024 / 1024
}
