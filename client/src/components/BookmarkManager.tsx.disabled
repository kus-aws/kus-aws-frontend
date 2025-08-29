import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Bookmark, Star, StarOff, Search, Calendar, Tag, Trash2 } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import type { Bookmark as BookmarkType } from '@/stores/userStore';

interface BookmarkManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookmarkManager({ isOpen, onClose }: BookmarkManagerProps) {
  const { bookmarks, removeBookmark, addNote } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkType | null>(null);
  const [noteContent, setNoteContent] = useState('');

  const filteredBookmarks = bookmarks.filter(bookmark =>
    bookmark.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bookmark.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bookmark.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateNote = (bookmark: BookmarkType) => {
    if (noteContent.trim()) {
      addNote({
        title: `${bookmark.subject} - ${bookmark.category} 노트`,
        content: noteContent,
        subject: bookmark.subject,
        category: bookmark.category,
        tags: bookmark.tags,
      });
      setNoteContent('');
      setSelectedBookmark(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center space-x-2">
              <Bookmark className="w-6 h-6 text-yellow-500" />
              <span>북마크 관리</span>
            </h2>
            <Button variant="ghost" onClick={onClose} data-testid="close-bookmarks">
              ✕
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="북마크 검색..."
              className="pl-10"
              data-testid="bookmark-search"
            />
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Bookmark List */}
          <div className="w-1/2 p-4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            {filteredBookmarks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? '검색 결과가 없습니다.' : '저장된 북마크가 없습니다.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookmarks.map((bookmark) => (
                  <Card
                    key={bookmark.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedBookmark?.id === bookmark.id
                        ? 'ring-2 ring-primary border-primary'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedBookmark(bookmark)}
                    data-testid={`bookmark-item-${bookmark.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {bookmark.subject}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {bookmark.category}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBookmark(bookmark.id);
                          }}
                          className="text-red-500 hover:text-red-700"
                          data-testid={`delete-bookmark-${bookmark.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-2">
                        {bookmark.content}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{bookmark.createdAt.toLocaleDateString()}</span>
                        </div>
                        {bookmark.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Tag className="w-3 h-3" />
                            <span>{bookmark.tags.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Bookmark Detail & Note Creation */}
          <div className="w-1/2 p-4 overflow-y-auto">
            {selectedBookmark ? (
              <div>
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg">북마크 상세</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium">전공:</span> {selectedBookmark.subject}
                      </div>
                      <div>
                        <span className="font-medium">카테고리:</span> {selectedBookmark.category}
                      </div>
                      <div>
                        <span className="font-medium">내용:</span>
                        <p className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                          {selectedBookmark.content}
                        </p>
                      </div>
                      {selectedBookmark.note && (
                        <div>
                          <span className="font-medium">메모:</span>
                          <p className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
                            {selectedBookmark.note}
                          </p>
                        </div>
                      )}
                      {selectedBookmark.tags.length > 0 && (
                        <div>
                          <span className="font-medium">태그:</span>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {selectedBookmark.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Create Note from Bookmark */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">노트 작성</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="이 북마크를 바탕으로 노트를 작성해보세요..."
                        rows={6}
                        data-testid="note-content"
                      />
                      <Button
                        onClick={() => handleCreateNote(selectedBookmark)}
                        disabled={!noteContent.trim()}
                        className="w-full"
                        data-testid="create-note"
                      >
                        노트 생성
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                왼쪽에서 북마크를 선택하세요
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}