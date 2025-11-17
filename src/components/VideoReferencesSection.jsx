import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Youtube, Instagram, Music } from 'lucide-react'

const VideoReferencesSection = ({ userId }) => {
  const [videoReferences, setVideoReferences] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newVideo, setNewVideo] = useState({
    video_url: '',
    platform: 'youtube',
    title: '',
    description: ''
  })

  // 영상 레퍼런스 로드
  useEffect(() => {
    if (userId) {
      loadVideoReferences()
    }
  }, [userId])

  const loadVideoReferences = async () => {
    try {
      const { data, error } = await supabase
        .from('creator_video_references')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setVideoReferences(data || [])
    } catch (err) {
      console.error('영상 레퍼런스 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  // 플랫폼 자동 감지
  const detectPlatform = (url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    if (url.includes('instagram.com')) return 'instagram'
    if (url.includes('tiktok.com')) return 'tiktok'
    return 'other'
  }

  // 영상 추가
  const handleAddVideo = async (e) => {
    e.preventDefault()
    setAdding(true)

    try {
      const platform = detectPlatform(newVideo.video_url)
      
      const { error } = await supabase
        .from('creator_video_references')
        .insert([{
          user_id: userId,
          video_url: newVideo.video_url,
          platform: platform,
          title: newVideo.title || '제목 없음',
          description: newVideo.description
        }])

      if (error) throw error

      alert('영상이 추가되었습니다!')
      setNewVideo({ video_url: '', platform: 'youtube', title: '', description: '' })
      loadVideoReferences()
    } catch (err) {
      console.error('영상 추가 실패:', err)
      alert('영상 추가에 실패했습니다: ' + err.message)
    } finally {
      setAdding(false)
    }
  }

  // 영상 삭제
  const handleDeleteVideo = async (videoId) => {
    if (!confirm('이 영상을 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('creator_video_references')
        .delete()
        .eq('id', videoId)

      if (error) throw error

      alert('영상이 삭제되었습니다!')
      loadVideoReferences()
    } catch (err) {
      console.error('영상 삭제 실패:', err)
      alert('영상 삭제에 실패했습니다: ' + err.message)
    }
  }

  // 플랫폼 아이콘
  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-600" />
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-600" />
      case 'tiktok':
        return <Music className="w-5 h-5 text-black" />
      default:
        return <span className="text-gray-600">🎬</span>
    }
  }

  // 플랫폼 이름
  const getPlatformName = (platform) => {
    switch (platform) {
      case 'youtube':
        return 'YouTube'
      case 'instagram':
        return 'Instagram'
      case 'tiktok':
        return 'TikTok'
      default:
        return '기타'
    }
  }

  if (loading) {
    return <div className="text-center py-4">로딩 중...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h2 className="text-2xl font-bold mb-4">📹 포트폴리오 영상</h2>
      <p className="text-gray-600 mb-6">
        캠페인 지원 시 참고할 수 있도록 본인의 대표 영상을 등록해주세요.
      </p>

      {/* 영상 추가 폼 */}
      <form onSubmit={handleAddVideo} className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-3">새 영상 추가</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              영상 URL *
            </label>
            <input
              type="url"
              value={newVideo.video_url}
              onChange={(e) => setNewVideo(prev => ({ ...prev, video_url: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              YouTube, Instagram, TikTok 링크를 입력하세요
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              영상 제목
            </label>
            <input
              type="text"
              value={newVideo.title}
              onChange={(e) => setNewVideo(prev => ({ ...prev, title: e.target.value }))}
              placeholder="예: 봄 메이크업 튜토리얼"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명 (선택)
            </label>
            <textarea
              value={newVideo.description}
              onChange={(e) => setNewVideo(prev => ({ ...prev, description: e.target.value }))}
              placeholder="영상에 대한 간단한 설명"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={adding}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {adding ? '추가 중...' : '영상 추가'}
          </button>
        </div>
      </form>

      {/* 등록된 영상 목록 */}
      <div>
        <h3 className="font-semibold mb-3">등록된 영상 ({videoReferences.length}개)</h3>
        
        {videoReferences.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>아직 등록된 영상이 없습니다.</p>
            <p className="text-sm mt-1">위 폼을 통해 영상을 추가해주세요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {videoReferences.map((video) => (
              <div
                key={video.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getPlatformIcon(video.platform)}
                      <span className="text-sm font-medium text-gray-600">
                        {getPlatformName(video.platform)}
                      </span>
                    </div>
                    
                    <h4 className="font-semibold text-lg mb-1">{video.title}</h4>
                    
                    {video.description && (
                      <p className="text-sm text-gray-600 mb-2">{video.description}</p>
                    )}
                    
                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 hover:text-purple-800 hover:underline break-all"
                    >
                      {video.video_url}
                    </a>
                    
                    <p className="text-xs text-gray-400 mt-2">
                      등록일: {new Date(video.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteVideo(video.id)}
                    className="ml-4 text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default VideoReferencesSection

