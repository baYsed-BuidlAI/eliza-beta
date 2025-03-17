import type { UUID } from '@elizaos/core';
import {
  Book,
  Clock,
  Database,
  File,
  FileText,
  LoaderIcon,
  MailCheck,
  MessageSquareShare,
  Pencil,
  Trash2,
  Upload,
  Download,
  Globe,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAgentMemories, useDeleteMemory } from '../hooks/use-query-hooks';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';

import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Memory } from '@elizaos/core';
import { useQueryClient } from '@tanstack/react-query';
import MemoryEditOverlay from './memory-edit-overlay';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

// Number of items to load per batch
const ITEMS_PER_PAGE = 10;

interface MemoryContent {
  thought?: boolean;
  channelType?: string;
  source?: string;
  text?: string;
  metadata?: {
    fileType?: string;
    title?: string;
    filename?: string;
    path?: string;
    description?: string;
  };
}

interface MemoryMetadata {
  type?: string;
  title?: string;
  filename?: string;
  path?: string;
  description?: string;
  fileExt?: string;
  timestamp?: number;
}

enum MemoryType {
  all = 'all',
  facts = 'facts',
  knowledge = 'knowledge',
  messagesSent = 'messagesSent',
  messagesReceived = 'messagesReceived',
  messages = 'messages',
}

export function AgentMemoryViewer({ agentId }: { agentId: UUID }) {
  const [selectedType, setSelectedType] = useState<MemoryType>(MemoryType.all);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [viewingContent, setViewingContent] = useState<Memory | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [visibleItems, setVisibleItems] = useState(ITEMS_PER_PAGE);
  const [loadingMore, setLoadingMore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Determine if we need to use the 'documents' table for knowledge
  const tableName =
    selectedType === MemoryType.knowledge
      ? 'documents'
      : selectedType === MemoryType.facts
        ? 'facts'
        : selectedType === MemoryType.messagesSent || selectedType === MemoryType.messagesReceived
          ? 'messages'
          : selectedType === MemoryType.all
            ? undefined
            : undefined;

  const { data: memories = [], isLoading, error } = useAgentMemories(agentId, tableName);
  const { mutate: deleteMemory } = useDeleteMemory();

  // Handle scroll to implement infinite loading
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || loadingMore || visibleItems >= filteredMemories.length) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px buffer

    if (scrolledToBottom) {
      setLoadingMore(true);
      // Add a small delay to simulate loading and prevent too rapid updates
      setTimeout(() => {
        setVisibleItems((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredMemories.length));
        setLoadingMore(false);
      }, 300);
    }
  }, [loadingMore, visibleItems]);
  // Reset visible items when filter changes or new data loads
  useEffect(() => {
    setVisibleItems(ITEMS_PER_PAGE);
  }, []);

  // Set up scroll event listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  if (isLoading && (!memories || memories.length === 0)) {
    return <div className="flex items-center justify-center h-40">Loading memories...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-40 text-destructive">
        Error loading agent memories
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const getMemoryIcon = (memory: Memory, content: MemoryContent) => {
    if (selectedType === MemoryType.knowledge) return <Book className="w-4 h-4" />;
    if (selectedType === MemoryType.facts) return <Globe className="w-4 h-4" />;
    if (memory.entityId === memory.agentId) return <MessageSquareShare className="w-4 h-4" />;
    if (memory.entityId !== memory.agentId) return <MailCheck className="w-4 h-4" />;
    if (content?.thought) return <LoaderIcon className="w-4 h-4" />;
    return <Database className="w-4 h-4" />;
  };

  const getMemoryLabel = (memoryType: string | undefined, content: MemoryContent) => {
    if (selectedType === MemoryType.knowledge) return 'Knowledge';
    if (selectedType === MemoryType.facts) return 'Facts';
    if (content?.thought) return 'Messages Sent';
    if (!content?.thought) return 'Messages Received';
    return memoryType || 'Memory';
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'md':
        return <File className="h-4 w-4 text-blue-500" />;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return <File className="h-4 w-4 text-yellow-500" />;
      case 'json':
        return <File className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleDelete = (memoryId: string) => {
    if (memoryId && window.confirm('Are you sure you want to delete this memory entry?')) {
      deleteMemory({ agentId, memoryId });
      setViewingContent(null);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const fileArray = Array.from(files);
      const result = await apiClient.uploadKnowledge(agentId, fileArray);

      if (result.success) {
        toast({
          title: 'Knowledge Uploaded',
          description: `Successfully uploaded ${fileArray.length} file(s)`,
        });

        queryClient.invalidateQueries({
          queryKey: ['agents', agentId, 'memories', 'documents'],
        });
      }
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload knowledge files',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredMemories = memories.filter((memory: Memory) => {
    if (selectedType === MemoryType.all) {
      const content = memory.content as MemoryContent;
      return !(content?.channelType === 'knowledge' || memory.metadata?.type === 'knowledge');
    }
    if (selectedType === MemoryType.knowledge) return true;

    const content = memory.content as MemoryContent;

    if (selectedType === MemoryType.messages) {
      return !(
        content?.thought ||
        content?.channelType === 'thought' ||
        memory.metadata?.type === 'thought'
      );
    }

    if (selectedType === MemoryType.messagesSent) {
      return memory.entityId === memory.agentId;
    }
    if (selectedType === MemoryType.messagesReceived) {
      return memory.entityId !== memory.agentId;
    }

    return true;
  });

  // Get visible subset for infinite scrolling
  const visibleMemories = filteredMemories.slice(0, visibleItems);
  const hasMoreToLoad = visibleItems < filteredMemories.length;

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[400px] w-full">
      <div className="flex justify-between items-center mb-4 px-4 pt-4 flex-none">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">
            {selectedType === 'knowledge' ? 'Knowledge Library' : 'Agent Memories'}
          </h3>
          {selectedType === 'knowledge' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUploadClick}
              disabled={isUploading}
              className="rounded-full"
              title="Upload documents"
            >
              <Upload className="h-4 w-4" />
              <span className="sr-only">{isUploading ? 'Uploading...' : 'Upload Documents'}</span>
            </Button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
            accept=".txt,.md,.js,.ts,.jsx,.tsx,.json,.csv,.html,.css,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          />
        </div>
        <Select
          value={selectedType}
          onValueChange={(value) => setSelectedType(value as MemoryType)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Filter memories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={MemoryType.all}>All</SelectItem>
            <SelectItem value={MemoryType.facts}>Facts</SelectItem>
            <SelectItem value={MemoryType.messagesSent}>Messages Sent</SelectItem>
            <SelectItem value={MemoryType.messagesReceived}>Messages Received</SelectItem>
            <SelectItem value={MemoryType.knowledge}>Knowledge</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 pb-4"
        style={{ height: 'calc(100% - 60px)' }}
      >
        {filteredMemories.length === 0 ? (
          <div className="text-muted-foreground text-center p-8 flex flex-col items-center gap-2">
            {selectedType === 'knowledge' ? (
              <>
                <Book className="h-12 w-12 opacity-20" />
                <p>No knowledge documents yet</p>
                <Button variant="outline" className="mt-2" onClick={handleUploadClick}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </Button>
              </>
            ) : (
              <>No memories recorded yet</>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* For knowledge files display - Single column layout */}
            {selectedType === 'knowledge' && (
              <div className="flex flex-col gap-4 max-w-3xl mx-auto">
                {visibleMemories.map((memory: Memory, index: number) => {
                  const metadata = (memory.metadata as MemoryMetadata) || {};
                  const title = metadata.title || memory.id || 'Unknown Document';
                  const filename = metadata.filename || 'Unknown Document';
                  const fileExt =
                    metadata.fileExt || filename.split('.').pop()?.toLowerCase() || '';

                  // Use the document title or filename for display
                  const displayName = title || filename;
                  // Use path information or filename as the subtitle
                  const subtitle = metadata.path || filename;

                  return (
                    <button
                      key={memory.id || index}
                      type="button"
                      className="w-full text-left"
                      onClick={() => setViewingContent(memory)}
                    >
                      <Card className="hover:bg-accent/10 transition-colors relative group">
                        {/* Icon and document type */}
                        <div className="absolute top-3 left-3 opacity-70">
                          {getFileIcon(filename)}
                        </div>

                        <CardHeader className="p-3 pb-2 pl-10">
                          {/* Path/filename as a small badge */}
                          <div className="text-xs text-muted-foreground mb-1 line-clamp-1">
                            {subtitle}
                          </div>

                          {/* Title and description section */}
                          <div className="mb-2">
                            <div className="text-sm font-medium mb-1">{displayName}</div>
                            {metadata.description && (
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {metadata.description}
                              </div>
                            )}
                          </div>
                        </CardHeader>

                        <CardFooter className="p-2 border-t bg-muted/30 text-xs text-muted-foreground">
                          <div className="flex justify-between items-center w-full">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1.5" />
                              <span>
                                {new Date(memory.createdAt || 0).toLocaleString(undefined, {
                                  month: 'numeric',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: 'numeric',
                                })}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="px-1.5 py-0 h-5">
                                {fileExt || 'unknown document'}
                              </Badge>

                              {memory.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleDelete(memory.id || '');
                                  }}
                                  title="Delete knowledge"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardFooter>
                      </Card>
                    </button>
                  );
                })}

                {/* Loading indicator for infinite scroll */}
                {hasMoreToLoad && (
                  <div className="flex justify-center p-4">
                    {loadingMore ? (
                      <div className="flex items-center gap-2">
                        <LoaderIcon className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading more...</span>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVisibleItems((prev) => prev + ITEMS_PER_PAGE)}
                        className="text-xs"
                      >
                        Show more
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* For non-knowledge memories - keep existing layout */}
            {selectedType !== 'knowledge' && (
              <div className="space-y-3">
                {visibleMemories.map((memory: Memory, index: number) => {
                  const memoryType = memory.metadata?.type || 'Memory';
                  const content = memory.content as MemoryContent;
                  const source = content?.source;

                  return (
                    <div
                      key={memory.id || index}
                      className="border rounded-md p-3 bg-card hover:bg-accent/10 transition-colors relative group"
                    >
                      {memory.id && (
                        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setEditingMemory(memory);
                            }}
                            title="Edit memory"
                          >
                            <Pencil className="h-4 w-4 text-regular" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleDelete(memory.id || '');
                            }}
                            title="Delete memory"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-1">
                          {getMemoryIcon(memory, content)} {getMemoryLabel(memoryType, content)}
                        </span>
                        <div className="flex items-center gap-2">
                          {source && (
                            <Badge variant="secondary" className="text-xs">
                              {source}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className="text-xs group-hover:mr-8 transition-all"
                          >
                            {formatDate(memory.createdAt || 0)}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-2 grid gap-2 rounded-full">
                        {memory.id && (
                          <div className="text-xs bg-muted px-2 py-1 rounded">
                            <span className="font-semibold">ID: </span>
                            {memory.id}
                          </div>
                        )}

                        {memory.content && (
                          <div className="text-xs bg-muted px-2 py-1 rounded max-h-40 overflow-y-auto">
                            <span className="font-semibold">Content: </span>
                            {typeof memory.content === 'object'
                              ? JSON.stringify(memory.content, null, 2)
                              : memory.content}
                          </div>
                        )}

                        {memory.metadata && Object.keys(memory.metadata).length > 0 && (
                          <div className="text-xs bg-muted px-2 py-1 rounded max-h-32 overflow-y-auto">
                            <span className="font-semibold">Metadata: </span>
                            {typeof memory.metadata === 'object'
                              ? JSON.stringify(memory.metadata, null, 2)
                              : memory.metadata}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading indicator for non-knowledge memories */}
                {hasMoreToLoad && (
                  <div className="flex justify-center p-4">
                    {loadingMore ? (
                      <div className="flex items-center gap-2">
                        <LoaderIcon className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading more...</span>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVisibleItems((prev) => prev + ITEMS_PER_PAGE)}
                        className="text-xs"
                      >
                        Show more
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Knowledge content dialog */}
      <Dialog open={!!viewingContent} onOpenChange={(open) => !open && setViewingContent(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center">
              {(() => {
                const metadata = (viewingContent?.metadata as MemoryMetadata) || {};
                const filename = metadata.filename || 'Unknown Document';
                const title = metadata.title || filename;

                return (
                  <>
                    {getFileIcon(filename)}
                    <span className="ml-2">{title}</span>
                  </>
                );
              })()}
            </DialogTitle>
            <DialogDescription className="flex items-center mt-1">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Added on{' '}
              {viewingContent
                ? formatDate(viewingContent.createdAt || viewingContent.metadata?.timestamp || 0)
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto my-4 border rounded-md p-4 bg-muted">
            {viewingContent && (
              <pre
                className={cn('text-sm whitespace-pre-wrap', {
                  'font-mono':
                    (
                      (viewingContent.content as MemoryContent)?.metadata?.fileType as string
                    )?.includes('application/') ||
                    (
                      (viewingContent.content as MemoryContent)?.metadata?.fileType as string
                    )?.includes('text/plain'),
                  '':
                    !(
                      (viewingContent.content as MemoryContent)?.metadata?.fileType as string
                    )?.includes('application/') &&
                    !(
                      (viewingContent.content as MemoryContent)?.metadata?.fileType as string
                    )?.includes('text/plain'),
                })}
              >
                {viewingContent.content?.text}
              </pre>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => viewingContent?.id && handleDelete(viewingContent.id)}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>

            <Button onClick={() => setViewingContent(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editingMemory && (
        <MemoryEditOverlay
          isOpen={!!editingMemory}
          onClose={() => setEditingMemory(null)}
          memory={editingMemory}
          agentId={agentId}
        />
      )}
    </div>
  );
}
