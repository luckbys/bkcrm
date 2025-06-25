// 💬 COMPONENTE DE BOLHA DE MENSAGEM APRIMORADO
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Check, 
  CheckCheck, 
  Reply, 
  MoreVertical, 
  Star, 
  StarOff, 
  Copy, 
  Trash2, 
  Edit3,
  Flag,
  AlertCircle,
  Lock,
  Play,
  Pause,
  Download,
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  FileIcon,
  Eye,
  ExternalLink
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ChatMessage } from '../../types/chat';
import { Button } from '../ui/button';

interface MessageBubbleProps {
  message: ChatMessage;
  isFromCurrentUser: boolean;
  showAvatar?: boolean;
  onReply?: (message: ChatMessage) => void;
  onToggleFavorite?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  isFavorite?: boolean;
  isHighlighted?: boolean;
  className?: string;
}

// 🎵 Componente de Player de Áudio
const AudioPlayer: React.FC<{ audioUrl: string; duration?: number }> = ({ audioUrl, duration }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [totalDuration, setTotalDuration] = React.useState(duration || 0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // 🔧 Função para tocar/pausar com tratamento de erro
  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Tentar reproduzir o áudio
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('🔴 [AUDIO] Erro ao reproduzir áudio:', error);
      setHasError(true);
      setErrorMessage('Erro ao reproduzir áudio. Tente novamente.');
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setTotalDuration(audioRef.current.duration);
      setIsLoading(false);
      console.log('✅ [AUDIO] Metadados carregados:', {
        duration: audioRef.current.duration,
        url: audioUrl
      });
    }
  };

  const handleLoadStart = () => {
    console.log('🔄 [AUDIO] Iniciando carregamento:', audioUrl);
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
  };

  const handleCanPlay = () => {
    console.log('✅ [AUDIO] Áudio pronto para reprodução');
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const error = (e.target as HTMLAudioElement).error;
    console.error('🔴 [AUDIO] Erro no áudio:', {
      error: error?.message,
      code: error?.code,
      url: audioUrl
    });
    
    setIsLoading(false);
    setHasError(true);
    setIsPlaying(false);
    
    // Mensagens de erro específicas por código
    switch (error?.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        setErrorMessage('Reprodução cancelada');
        break;
      case MediaError.MEDIA_ERR_NETWORK:
        setErrorMessage('Erro de rede');
        break;
      case MediaError.MEDIA_ERR_DECODE:
        setErrorMessage('Erro de decodificação');
        break;
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        setErrorMessage('Formato não suportado');
        break;
      default:
        setErrorMessage('Erro ao carregar áudio');
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || totalDuration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * totalDuration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // 🛡️ Validação da URL
  React.useEffect(() => {
    if (!audioUrl) {
      setHasError(true);
      setErrorMessage('URL do áudio não fornecida');
    }
  }, [audioUrl]);

  if (hasError) {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <Music className="w-4 h-4 text-red-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-red-700">Erro no Áudio</span>
          </div>
          <p className="text-xs text-red-600">{errorMessage}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(audioUrl, '_blank')}
          className="w-8 h-8 p-0"
          title="Abrir áudio em nova aba"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onEnded={handleEnded}
        preload="metadata"
        crossOrigin="anonymous"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePlay}
        disabled={isLoading}
        className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white p-0 disabled:bg-gray-300"
      >
        {isLoading ? (
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </Button>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Music className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {isLoading ? 'Carregando...' : 'Áudio'}
          </span>
        </div>
        
        <div className="relative">
          <div 
            className="w-full h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.open(audioUrl, '_blank')}
        className="w-8 h-8 p-0"
        title="Abrir áudio em nova aba"
      >
        <Download className="w-4 h-4" />
      </Button>
    </div>
  );
};

// 🖼️ Componente de Visualização de Imagem
const ImageViewer: React.FC<{ imageUrl: string; altText?: string }> = ({ imageUrl, altText }) => {
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  return (
    <>
      <div className="relative group cursor-pointer" onClick={() => setIsFullScreen(true)}>
        <div className="relative rounded-lg overflow-hidden bg-gray-100">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {hasError ? (
            <div className="flex items-center justify-center h-48 bg-gray-100">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Erro ao carregar imagem</p>
              </div>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={altText || "Imagem enviada"}
              className={cn(
                "w-full max-w-sm object-cover rounded-lg transition-all duration-200",
                isLoading && "opacity-0"
              )}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
              style={{ maxHeight: '300px' }}
            />
          )}
          
          {!isLoading && !hasError && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all duration-200" />
            </div>
          )}
        </div>
      </div>

      {/* Modal de visualização em tela cheia */}
      {isFullScreen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsFullScreen(false)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={imageUrl}
              alt={altText || "Imagem enviada"}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setIsFullScreen(false)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

// 🎬 Componente de Player de Vídeo
const VideoPlayer: React.FC<{ videoUrl: string; thumbnailUrl?: string }> = ({ videoUrl, thumbnailUrl }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-100 max-w-sm">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {hasError ? (
        <div className="flex items-center justify-center h-48 bg-gray-100">
          <div className="text-center">
            <Film className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Erro ao carregar vídeo</p>
          </div>
        </div>
      ) : (
        <video
          src={videoUrl}
          poster={thumbnailUrl}
          controls
          className="w-full max-h-80 object-cover"
          onLoadStart={() => setIsLoading(true)}
          onLoadedData={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        >
          Seu navegador não suporta reprodução de vídeo.
        </video>
      )}
    </div>
  );
};

// 📄 Componente de Visualização de Arquivo
const FileViewer: React.FC<{ 
  fileUrl: string; 
  fileName: string; 
  fileSize?: number; 
  fileType?: string;
}> = ({ fileUrl, fileName, fileSize, fileType }) => {
  const getFileIcon = () => {
    if (!fileType) return FileIcon;
    
    if (fileType.includes('pdf')) return FileText;
    if (fileType.includes('image')) return ImageIcon;
    if (fileType.includes('video')) return Film;
    if (fileType.includes('audio')) return Music;
    
    return FileIcon;
  };

  const getFileColor = () => {
    if (!fileType) return 'text-gray-500';
    
    if (fileType.includes('pdf')) return 'text-red-500';
    if (fileType.includes('image')) return 'text-green-500';
    if (fileType.includes('video')) return 'text-purple-500';
    if (fileType.includes('audio')) return 'text-blue-500';
    if (fileType.includes('document') || fileType.includes('word')) return 'text-blue-600';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'text-green-600';
    
    return 'text-gray-500';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = () => {
    window.open(fileUrl, '_blank');
  };

  const FileIconComponent = getFileIcon();

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors max-w-sm">
      <div className={cn("p-2 rounded-lg bg-white", getFileColor())}>
        <FileIconComponent className="w-6 h-6" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900 truncate" title={fileName}>
          {fileName}
        </div>
        {fileSize && (
          <div className="text-xs text-gray-500">
            {formatFileSize(fileSize)}
          </div>
        )}
      </div>

      <div className="flex gap-1">
        {fileType?.includes('pdf') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreview}
            className="w-8 h-8 p-0"
            title="Visualizar"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="w-8 h-8 p-0"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// 🎯 Componente de Renderização de Conteúdo da Mensagem
const MessageContent: React.FC<{ 
  message: ChatMessage; 
  isHighlighted: boolean; 
  styles: any;
  searchQuery?: string;
}> = ({ message, isHighlighted, styles, searchQuery }) => {
  // Highlight texto de busca
  const highlightText = (text: string, query?: string) => {
    if (!query || !isHighlighted) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Renderizar conteúdo baseado no tipo da mensagem
  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="space-y-2">
            <ImageViewer 
              imageUrl={message.metadata?.fileUrl || message.content} 
              altText={message.metadata?.fileName || 'Imagem enviada'}
            />
            {message.content && message.content !== message.metadata?.fileUrl && (
              <div className={cn("text-sm leading-relaxed whitespace-pre-wrap break-words", styles.textAlign)}>
                {highlightText(message.content, searchQuery)}
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-2">
            <AudioPlayer 
              audioUrl={message.metadata?.fileUrl || message.content}
              duration={message.metadata?.duration}
            />
            {message.content && message.content !== message.metadata?.fileUrl && (
              <div className={cn("text-sm leading-relaxed whitespace-pre-wrap break-words", styles.textAlign)}>
                {highlightText(message.content, searchQuery)}
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-2">
            <VideoPlayer 
              videoUrl={message.metadata?.fileUrl || message.content}
              thumbnailUrl={message.metadata?.thumbnailUrl}
            />
            {message.content && message.content !== message.metadata?.fileUrl && (
              <div className={cn("text-sm leading-relaxed whitespace-pre-wrap break-words", styles.textAlign)}>
                {highlightText(message.content, searchQuery)}
              </div>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <FileViewer 
              fileUrl={message.metadata?.fileUrl || message.content}
              fileName={message.metadata?.fileName || 'Arquivo'}
              fileSize={message.metadata?.fileSize}
              fileType={message.metadata?.fileType}
            />
            {message.content && message.content !== message.metadata?.fileUrl && (
              <div className={cn("text-sm leading-relaxed whitespace-pre-wrap break-words", styles.textAlign)}>
                {highlightText(message.content, searchQuery)}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className={cn("text-sm leading-relaxed whitespace-pre-wrap break-words", styles.textAlign)}>
            {highlightText(message.content, searchQuery)}
          </div>
        );
    }
  };

  return <>{renderContent()}</>;
};

// 👤 Componente de Avatar
const MessageAvatar: React.FC<{ 
  senderName: string; 
  isFromCurrentUser: boolean;
  isInternal: boolean;
}> = ({ senderName, isFromCurrentUser, isInternal }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getAvatarColor = () => {
    if (isInternal) return 'bg-amber-500';
    if (isFromCurrentUser) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className={cn(
      "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0",
      getAvatarColor()
    )}>
      {isInternal ? "🔒" : getInitials(senderName)}
    </div>
  );
};

// 📊 Componente de Status da Mensagem
const MessageStatus: React.FC<{ 
  status: ChatMessage['status']; 
  isFromCurrentUser: boolean;
}> = ({ status, isFromCurrentUser }) => {
  if (!isFromCurrentUser) return null;

  const statusConfig = {
    sending: { icon: Check, color: 'text-gray-400', opacity: 'opacity-50' },
    sent: { icon: Check, color: 'text-gray-500', opacity: 'opacity-75' },
    delivered: { icon: CheckCheck, color: 'text-gray-500', opacity: 'opacity-75' },
    read: { icon: CheckCheck, color: 'text-blue-500', opacity: 'opacity-100' },
    failed: { icon: Check, color: 'text-red-500', opacity: 'opacity-100' }
  };

  const config = statusConfig[status || 'sent'];
  const Icon = config.icon;

  return (
    <Icon 
      className={cn(
        "w-3 h-3 ml-1",
        config.color,
        config.opacity
      )} 
    />
  );
};

// 🎯 Componente Principal
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isFromCurrentUser,
  showAvatar = true,
  onReply,
  onToggleFavorite,
  onCopy,
  onDelete,
  onEdit,
  isFavorite = false,
  isHighlighted = false,
  className
}) => {
  const [showActions, setShowActions] = React.useState(false);
  const [showMoreOptions, setShowMoreOptions] = React.useState(false);

  const getBubbleStyles = () => {
    if (message.isInternal) {
      return {
        container: "justify-center",
        bubble: "bg-amber-50 border border-amber-200 text-amber-800 max-w-[80%]",
        textAlign: "text-center" as const
      };
    }

    if (isFromCurrentUser) {
      return {
        container: "justify-end",
        bubble: "bg-blue-500 text-white max-w-[75%] rounded-br-sm",
        textAlign: "text-left" as const
      };
    }

    return {
      container: "justify-start",
      bubble: "bg-white border border-gray-200 text-gray-900 max-w-[75%] rounded-bl-sm",
      textAlign: "text-left" as const
    };
  };

  const styles = getBubbleStyles();
  const timestamp = formatDistanceToNow(message.timestamp, { 
    addSuffix: true, 
    locale: ptBR 
  });

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.content);
    } else {
      navigator.clipboard.writeText(message.content);
    }
  };

  const handleToggleFavorite = () => {
    if (onToggleFavorite) {
      onToggleFavorite(message.id);
    }
  };

  return (
    <div className={cn(
      "flex w-full mb-4 transition-all duration-200",
      styles.container,
      isHighlighted && "bg-yellow-50 p-2 rounded-lg border border-yellow-200",
      className
    )}>
      <div className={cn(
        "flex gap-3 items-end",
        isFromCurrentUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* 👤 Avatar */}
        {showAvatar && (
          <MessageAvatar
            senderName={message.senderName}
            isFromCurrentUser={isFromCurrentUser}
            isInternal={message.isInternal}
          />
        )}

        {/* 💬 Bolha da Mensagem */}
        <div 
          className="relative group"
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          {/* Nome do remetente (apenas para mensagens do cliente ou notas internas) */}
          {(!isFromCurrentUser || message.isInternal) && (
            <div className={cn(
              "text-xs font-medium mb-1 px-1",
              isFromCurrentUser ? "text-right text-gray-600" : "text-left text-gray-600"
            )}>
              {message.isInternal && "🔒 NOTA INTERNA • "}
              {message.senderName}
            </div>
          )}

          {/* Conteúdo da mensagem */}
          <div className={cn(
            "px-4 py-3 rounded-2xl shadow-sm relative transition-all duration-200",
            styles.bubble,
            isFavorite && "ring-2 ring-yellow-400 ring-opacity-50",
            isHighlighted && "ring-2 ring-yellow-300 ring-opacity-75"
          )}>
            <MessageContent 
              message={message}
              isHighlighted={isHighlighted}
              styles={styles}
              searchQuery={isHighlighted ? message.content : undefined}
            />

            {/* Timestamp e Status */}
            <div className={cn(
              "flex items-center justify-between mt-2 text-xs",
              isFromCurrentUser ? "text-blue-100" : "text-gray-500"
            )}>
              <span className="opacity-75">
                {timestamp}
              </span>
              <div className="flex items-center gap-1">
                {isFavorite && (
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                )}
                <MessageStatus 
                  status={message.status} 
                  isFromCurrentUser={isFromCurrentUser} 
                />
              </div>
            </div>
          </div>

          {/* Ações da Mensagem (aparecem no hover) */}
          {showActions && (
            <div className={cn(
              "absolute top-0 flex items-center gap-1 z-10",
              isFromCurrentUser ? "-left-12" : "-right-12"
            )}>
              {/* Responder */}
              {onReply && (
                <button
                  onClick={() => onReply(message)}
                  className="w-8 h-8 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 flex items-center justify-center transition-all duration-200 hover:scale-110"
                  title="Responder à mensagem"
                >
                  <Reply className="w-4 h-4 text-gray-600" />
                </button>
              )}
              
              {/* Favoritar */}
              {onToggleFavorite && (
                <button
                  onClick={handleToggleFavorite}
                  className="w-8 h-8 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 flex items-center justify-center transition-all duration-200 hover:scale-110"
                  title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  {isFavorite ? (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  ) : (
                    <StarOff className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              )}

              {/* Copiar */}
              <button
                onClick={handleCopy}
                className="w-8 h-8 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 flex items-center justify-center transition-all duration-200 hover:scale-110"
                title="Copiar mensagem"
              >
                <Copy className="w-4 h-4 text-gray-600" />
              </button>
              
              {/* Mais opções */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  className="w-8 h-8 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 flex items-center justify-center transition-all duration-200 hover:scale-110"
                  title="Mais opções"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>

                {/* Menu de opções */}
                {showMoreOptions && (
                  <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[120px]">
                    {onEdit && isFromCurrentUser && (
                      <button
                        onClick={() => {
                          onEdit(message.id, message.content);
                          setShowMoreOptions(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Editar
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        handleCopy();
                        setShowMoreOptions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copiar
                    </button>

                    <button
                      onClick={handleToggleFavorite}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      {isFavorite ? (
                        <>
                          <StarOff className="w-4 h-4" />
                          Remover favorito
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4" />
                          Favoritar
                        </>
                      )}
                    </button>

                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Flag className="w-4 h-4" />
                      Reportar
                    </button>

                    {onDelete && isFromCurrentUser && (
                      <button
                        onClick={() => {
                          onDelete(message.id);
                          setShowMoreOptions(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Badge especial para notas internas */}
          {message.isInternal && (
            <div className="text-center mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                <Lock className="w-3 h-3" />
                Nota Interna
              </span>
            </div>
          )}

          {/* Badge para mensagens favoritas */}
          {isFavorite && (
            <div className="absolute -top-2 -right-2">
              <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <Star className="w-3 h-3 text-white fill-current" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
