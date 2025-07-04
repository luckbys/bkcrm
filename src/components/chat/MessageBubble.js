import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// 💬 COMPONENTE DE BOLHA DE MENSAGEM APRIMORADO
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, CheckCheck, Reply, MoreVertical, Star, StarOff, Copy, Trash2, Edit3, Flag, Lock, Play, Pause, Download, Image as ImageIcon, FileText, Film, Music, FileIcon, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
// 🎵 Componente de Player de Áudio
const AudioPlayer = ({ audioUrl, duration }) => {
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState(0);
    const [totalDuration, setTotalDuration] = React.useState(duration || 0);
    const [isLoading, setIsLoading] = React.useState(true);
    const [hasError, setHasError] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');
    const audioRef = React.useRef(null);
    // 🔧 Função para tocar/pausar com tratamento de erro
    const togglePlay = async () => {
        if (!audioRef.current)
            return;
        try {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            }
            else {
                // Tentar reproduzir o áudio
                await audioRef.current.play();
                setIsPlaying(true);
            }
        }
        catch (error) {
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
    const handleError = (e) => {
        const error = e.target.error;
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
    const handleSeek = (e) => {
        if (!audioRef.current || totalDuration === 0)
            return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * totalDuration;
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };
    const formatTime = (seconds) => {
        if (isNaN(seconds) || !isFinite(seconds))
            return '0:00';
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
        return (_jsxs("div", { className: "flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-red-100 flex items-center justify-center", children: _jsx(Music, { className: "w-4 h-4 text-red-500" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "flex items-center gap-2 mb-1", children: _jsx("span", { className: "text-sm font-medium text-red-700", children: "Erro no \u00C1udio" }) }), _jsx("p", { className: "text-xs text-red-600", children: errorMessage })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => window.open(audioUrl, '_blank'), className: "w-8 h-8 p-0", title: "Abrir \u00E1udio em nova aba", children: _jsx(Download, { className: "w-4 h-4" }) })] }));
    }
    return (_jsxs("div", { className: "flex items-center gap-3 p-3 bg-gray-50 rounded-lg border", children: [_jsx("audio", { ref: audioRef, src: audioUrl, onTimeUpdate: handleTimeUpdate, onLoadedMetadata: handleLoadedMetadata, onLoadStart: handleLoadStart, onCanPlay: handleCanPlay, onError: handleError, onEnded: handleEnded, preload: "metadata", crossOrigin: "anonymous" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: togglePlay, disabled: isLoading, className: "w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white p-0 disabled:bg-gray-300", children: isLoading ? (_jsx("div", { className: "w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" })) : isPlaying ? (_jsx(Pause, { className: "w-4 h-4" })) : (_jsx(Play, { className: "w-4 h-4 ml-0.5" })) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(Music, { className: "w-4 h-4 text-gray-500" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: isLoading ? 'Carregando...' : 'Áudio' })] }), _jsx("div", { className: "relative", children: _jsx("div", { className: "w-full h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer", onClick: handleSeek, children: _jsx("div", { className: "h-full bg-blue-500 transition-all duration-100", style: { width: `${progressPercentage}%` } }) }) }), _jsxs("div", { className: "flex justify-between text-xs text-gray-500 mt-1", children: [_jsx("span", { children: formatTime(currentTime) }), _jsx("span", { children: formatTime(totalDuration) })] })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => window.open(audioUrl, '_blank'), className: "w-8 h-8 p-0", title: "Abrir \u00E1udio em nova aba", children: _jsx(Download, { className: "w-4 h-4" }) })] }));
};
// 🖼️ Componente de Visualização de Imagem
const ImageViewer = ({ imageUrl, altText }) => {
    const [isFullScreen, setIsFullScreen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [hasError, setHasError] = React.useState(false);
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "relative group cursor-pointer", onClick: () => setIsFullScreen(true), children: _jsxs("div", { className: "relative rounded-lg overflow-hidden bg-gray-100", children: [isLoading && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }) })), hasError ? (_jsx("div", { className: "flex items-center justify-center h-48 bg-gray-100", children: _jsxs("div", { className: "text-center", children: [_jsx(ImageIcon, { className: "w-12 h-12 text-gray-400 mx-auto mb-2" }), _jsx("p", { className: "text-sm text-gray-500", children: "Erro ao carregar imagem" })] }) })) : (_jsx("img", { src: imageUrl, alt: altText || "Imagem enviada", className: cn("w-full max-w-sm object-cover rounded-lg transition-all duration-200", isLoading && "opacity-0"), onLoad: () => setIsLoading(false), onError: () => {
                                setIsLoading(false);
                                setHasError(true);
                            }, style: { maxHeight: '300px' } })), !isLoading && !hasError && (_jsx("div", { className: "absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center", children: _jsx(Eye, { className: "w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all duration-200" }) }))] }) }), isFullScreen && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4", onClick: () => setIsFullScreen(false), children: _jsxs("div", { className: "relative max-w-full max-h-full", children: [_jsx("img", { src: imageUrl, alt: altText || "Imagem enviada", className: "max-w-full max-h-full object-contain", onClick: (e) => e.stopPropagation() }), _jsx(Button, { variant: "ghost", className: "absolute top-4 right-4 text-white hover:bg-white/20", onClick: () => setIsFullScreen(false), children: "\u2715" })] }) }))] }));
};
// 🎬 Componente de Player de Vídeo
const VideoPlayer = ({ videoUrl, thumbnailUrl }) => {
    const [isLoading, setIsLoading] = React.useState(true);
    const [hasError, setHasError] = React.useState(false);
    return (_jsxs("div", { className: "relative rounded-lg overflow-hidden bg-gray-100 max-w-sm", children: [isLoading && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center z-10", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }) })), hasError ? (_jsx("div", { className: "flex items-center justify-center h-48 bg-gray-100", children: _jsxs("div", { className: "text-center", children: [_jsx(Film, { className: "w-12 h-12 text-gray-400 mx-auto mb-2" }), _jsx("p", { className: "text-sm text-gray-500", children: "Erro ao carregar v\u00EDdeo" })] }) })) : (_jsx("video", { src: videoUrl, poster: thumbnailUrl, controls: true, className: "w-full max-h-80 object-cover", onLoadStart: () => setIsLoading(true), onLoadedData: () => setIsLoading(false), onError: () => {
                    setIsLoading(false);
                    setHasError(true);
                }, children: "Seu navegador n\u00E3o suporta reprodu\u00E7\u00E3o de v\u00EDdeo." }))] }));
};
// 📄 Componente de Visualização de Arquivo
const FileViewer = ({ fileUrl, fileName, fileSize, fileType }) => {
    const getFileIcon = () => {
        if (!fileType)
            return FileIcon;
        if (fileType.includes('pdf'))
            return FileText;
        if (fileType.includes('image'))
            return ImageIcon;
        if (fileType.includes('video'))
            return Film;
        if (fileType.includes('audio'))
            return Music;
        return FileIcon;
    };
    const getFileColor = () => {
        if (!fileType)
            return 'text-gray-500';
        if (fileType.includes('pdf'))
            return 'text-red-500';
        if (fileType.includes('image'))
            return 'text-green-500';
        if (fileType.includes('video'))
            return 'text-purple-500';
        if (fileType.includes('audio'))
            return 'text-blue-500';
        if (fileType.includes('document') || fileType.includes('word'))
            return 'text-blue-600';
        if (fileType.includes('spreadsheet') || fileType.includes('excel'))
            return 'text-green-600';
        return 'text-gray-500';
    };
    const formatFileSize = (bytes) => {
        if (!bytes)
            return '';
        if (bytes < 1024)
            return bytes + ' B';
        if (bytes < 1024 * 1024)
            return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024)
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
    return (_jsxs("div", { className: "flex items-center gap-3 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors max-w-sm", children: [_jsx("div", { className: cn("p-2 rounded-lg bg-white", getFileColor()), children: _jsx(FileIconComponent, { className: "w-6 h-6" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "font-medium text-sm text-gray-900 truncate", title: fileName, children: fileName }), fileSize && (_jsx("div", { className: "text-xs text-gray-500", children: formatFileSize(fileSize) }))] }), _jsxs("div", { className: "flex gap-1", children: [fileType?.includes('pdf') && (_jsx(Button, { variant: "ghost", size: "sm", onClick: handlePreview, className: "w-8 h-8 p-0", title: "Visualizar", children: _jsx(Eye, { className: "w-4 h-4" }) })), _jsx(Button, { variant: "ghost", size: "sm", onClick: handleDownload, className: "w-8 h-8 p-0", title: "Download", children: _jsx(Download, { className: "w-4 h-4" }) })] })] }));
};
// 🎯 Componente de Renderização de Conteúdo da Mensagem
const MessageContent = ({ message, isHighlighted, styles, searchQuery }) => {
    // Highlight texto de busca
    const highlightText = (text, query) => {
        if (!query || !isHighlighted)
            return text;
        const regex = new RegExp(`(${query})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, index) => regex.test(part) ? (_jsx("mark", { className: "bg-yellow-200 px-1 rounded", children: part }, index)) : part);
    };
    // Renderizar conteúdo baseado no tipo da mensagem
    const renderContent = () => {
        switch (message.type) {
            case 'image':
                return (_jsxs("div", { className: "space-y-2", children: [_jsx(ImageViewer, { imageUrl: message.metadata?.fileUrl || message.content, altText: message.metadata?.fileName || 'Imagem enviada' }), message.content && message.content !== message.metadata?.fileUrl && (_jsx("div", { className: cn("text-sm leading-relaxed whitespace-pre-wrap break-words", styles.textAlign), children: highlightText(message.content, searchQuery) }))] }));
            case 'audio':
                return (_jsxs("div", { className: "space-y-2", children: [_jsx(AudioPlayer, { audioUrl: message.metadata?.fileUrl || message.content, duration: message.metadata?.duration }), message.content && message.content !== message.metadata?.fileUrl && (_jsx("div", { className: cn("text-sm leading-relaxed whitespace-pre-wrap break-words", styles.textAlign), children: highlightText(message.content, searchQuery) }))] }));
            case 'video':
                return (_jsxs("div", { className: "space-y-2", children: [_jsx(VideoPlayer, { videoUrl: message.metadata?.fileUrl || message.content, thumbnailUrl: message.metadata?.thumbnailUrl }), message.content && message.content !== message.metadata?.fileUrl && (_jsx("div", { className: cn("text-sm leading-relaxed whitespace-pre-wrap break-words", styles.textAlign), children: highlightText(message.content, searchQuery) }))] }));
            case 'file':
                return (_jsxs("div", { className: "space-y-2", children: [_jsx(FileViewer, { fileUrl: message.metadata?.fileUrl || message.content, fileName: message.metadata?.fileName || 'Arquivo', fileSize: message.metadata?.fileSize, fileType: message.metadata?.fileType }), message.content && message.content !== message.metadata?.fileUrl && (_jsx("div", { className: cn("text-sm leading-relaxed whitespace-pre-wrap break-words", styles.textAlign), children: highlightText(message.content, searchQuery) }))] }));
            default:
                return (_jsx("div", { className: cn("text-sm leading-relaxed whitespace-pre-wrap break-words", styles.textAlign), children: highlightText(message.content, searchQuery) }));
        }
    };
    return _jsx(_Fragment, { children: renderContent() });
};
// 👤 Componente de Avatar
const MessageAvatar = ({ senderName, isFromCurrentUser, isInternal }) => {
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };
    const getAvatarColor = () => {
        if (isInternal)
            return 'bg-amber-500';
        if (isFromCurrentUser)
            return 'bg-blue-500';
        return 'bg-green-500';
    };
    return (_jsx("div", { className: cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0", getAvatarColor()), children: isInternal ? "🔒" : getInitials(senderName) }));
};
// 📊 Componente de Status da Mensagem
const MessageStatus = ({ status, isFromCurrentUser }) => {
    if (!isFromCurrentUser)
        return null;
    const statusConfig = {
        sending: { icon: Check, color: 'text-gray-400', opacity: 'opacity-50' },
        sent: { icon: Check, color: 'text-gray-500', opacity: 'opacity-75' },
        delivered: { icon: CheckCheck, color: 'text-gray-500', opacity: 'opacity-75' },
        read: { icon: CheckCheck, color: 'text-blue-500', opacity: 'opacity-100' },
        failed: { icon: Check, color: 'text-red-500', opacity: 'opacity-100' }
    };
    const config = statusConfig[status || 'sent'];
    const Icon = config.icon;
    return (_jsx(Icon, { className: cn("w-3 h-3 ml-1", config.color, config.opacity) }));
};
// 🎯 Componente Principal
export const MessageBubble = ({ message, isFromCurrentUser, showAvatar = true, onReply, onToggleFavorite, onCopy, onDelete, onEdit, isFavorite = false, isHighlighted = false, className }) => {
    const [showActions, setShowActions] = React.useState(false);
    const [showMoreOptions, setShowMoreOptions] = React.useState(false);
    const getBubbleStyles = () => {
        if (message.isInternal) {
            return {
                container: "justify-center",
                bubble: "bg-amber-50 border border-amber-200 text-amber-800 max-w-[80%]",
                textAlign: "text-center"
            };
        }
        if (isFromCurrentUser) {
            return {
                container: "justify-end",
                bubble: "bg-blue-500 text-white max-w-[75%] rounded-br-sm",
                textAlign: "text-left"
            };
        }
        return {
            container: "justify-start",
            bubble: "bg-white border border-gray-200 text-gray-900 max-w-[75%] rounded-bl-sm",
            textAlign: "text-left"
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
        }
        else {
            navigator.clipboard.writeText(message.content);
        }
    };
    const handleToggleFavorite = () => {
        if (onToggleFavorite) {
            onToggleFavorite(message.id);
        }
    };
    return (_jsx("div", { className: cn("flex w-full mb-4 transition-all duration-200", styles.container, isHighlighted && "bg-yellow-50 p-2 rounded-lg border border-yellow-200", className), children: _jsxs("div", { className: cn("flex gap-3 items-end", isFromCurrentUser ? "flex-row-reverse" : "flex-row"), children: [showAvatar && (_jsx(MessageAvatar, { senderName: message.senderName, isFromCurrentUser: isFromCurrentUser, isInternal: message.isInternal })), _jsxs("div", { className: "relative group", onMouseEnter: () => setShowActions(true), onMouseLeave: () => setShowActions(false), children: [(!isFromCurrentUser || message.isInternal) && (_jsxs("div", { className: cn("text-xs font-medium mb-1 px-1", isFromCurrentUser ? "text-right text-gray-600" : "text-left text-gray-600"), children: [message.isInternal && "🔒 NOTA INTERNA • ", message.senderName] })), _jsxs("div", { className: cn("px-4 py-3 rounded-2xl shadow-sm relative transition-all duration-200", styles.bubble, isFavorite && "ring-2 ring-yellow-400 ring-opacity-50", isHighlighted && "ring-2 ring-yellow-300 ring-opacity-75"), children: [_jsx(MessageContent, { message: message, isHighlighted: isHighlighted, styles: styles, searchQuery: isHighlighted ? message.content : undefined }), _jsxs("div", { className: cn("flex items-center justify-between mt-2 text-xs", isFromCurrentUser ? "text-blue-100" : "text-gray-500"), children: [_jsx("span", { className: "opacity-75", children: timestamp }), _jsxs("div", { className: "flex items-center gap-1", children: [isFavorite && (_jsx(Star, { className: "w-3 h-3 text-yellow-500 fill-current" })), _jsx(MessageStatus, { status: message.status, isFromCurrentUser: isFromCurrentUser })] })] })] }), showActions && (_jsxs("div", { className: cn("absolute top-0 flex items-center gap-1 z-10", isFromCurrentUser ? "-left-12" : "-right-12"), children: [onReply && (_jsx("button", { onClick: () => onReply(message), className: "w-8 h-8 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 flex items-center justify-center transition-all duration-200 hover:scale-110", title: "Responder \u00E0 mensagem", children: _jsx(Reply, { className: "w-4 h-4 text-gray-600" }) })), onToggleFavorite && (_jsx("button", { onClick: handleToggleFavorite, className: "w-8 h-8 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 flex items-center justify-center transition-all duration-200 hover:scale-110", title: isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos", children: isFavorite ? (_jsx(Star, { className: "w-4 h-4 text-yellow-500 fill-current" })) : (_jsx(StarOff, { className: "w-4 h-4 text-gray-600" })) })), _jsx("button", { onClick: handleCopy, className: "w-8 h-8 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 flex items-center justify-center transition-all duration-200 hover:scale-110", title: "Copiar mensagem", children: _jsx(Copy, { className: "w-4 h-4 text-gray-600" }) }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setShowMoreOptions(!showMoreOptions), className: "w-8 h-8 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 flex items-center justify-center transition-all duration-200 hover:scale-110", title: "Mais op\u00E7\u00F5es", children: _jsx(MoreVertical, { className: "w-4 h-4 text-gray-600" }) }), showMoreOptions && (_jsxs("div", { className: "absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[120px]", children: [onEdit && isFromCurrentUser && (_jsxs("button", { onClick: () => {
                                                        onEdit(message.id, message.content);
                                                        setShowMoreOptions(false);
                                                    }, className: "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2", children: [_jsx(Edit3, { className: "w-4 h-4" }), "Editar"] })), _jsxs("button", { onClick: () => {
                                                        handleCopy();
                                                        setShowMoreOptions(false);
                                                    }, className: "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2", children: [_jsx(Copy, { className: "w-4 h-4" }), "Copiar"] }), _jsx("button", { onClick: handleToggleFavorite, className: "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2", children: isFavorite ? (_jsxs(_Fragment, { children: [_jsx(StarOff, { className: "w-4 h-4" }), "Remover favorito"] })) : (_jsxs(_Fragment, { children: [_jsx(Star, { className: "w-4 h-4" }), "Favoritar"] })) }), _jsxs("button", { className: "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2", children: [_jsx(Flag, { className: "w-4 h-4" }), "Reportar"] }), onDelete && isFromCurrentUser && (_jsxs("button", { onClick: () => {
                                                        onDelete(message.id);
                                                        setShowMoreOptions(false);
                                                    }, className: "w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2", children: [_jsx(Trash2, { className: "w-4 h-4" }), "Excluir"] }))] }))] })] })), message.isInternal && (_jsx("div", { className: "text-center mt-2", children: _jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full", children: [_jsx(Lock, { className: "w-3 h-3" }), "Nota Interna"] }) })), isFavorite && (_jsx("div", { className: "absolute -top-2 -right-2", children: _jsx("div", { className: "w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg", children: _jsx(Star, { className: "w-3 h-3 text-white fill-current" }) }) }))] })] }) }));
};
