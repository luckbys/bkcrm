import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Image, 
  Video, 
  Mic, 
  FileText, 
  MapPin, 
  Contact, 
  Sticker, 
  Heart, 
  BarChart3,
  List,
  MousePointer,
  Send,
  Upload,
  Smile,
  Clock,
  Users,
  Link,
  Plus,
  Trash2
} from 'lucide-react';
import { useEvolutionSender } from '../../hooks/useEvolutionSender';
import { useToast } from '../../hooks/use-toast';

interface EvolutionMessageComposerProps {
  recipientNumber: string;
  onMessageSent?: (result: any) => void;
  disabled?: boolean;
  className?: string;
}

interface PollOption {
  id: string;
  text: string;
}

interface ListSection {
  id: string;
  title: string;
  rows: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

interface ButtonConfig {
  id: string;
  type: 'replyButton' | 'urlButton' | 'callButton';
  title: string;
  payload?: string;
  url?: string;
  phoneNumber?: string;
}

export const EvolutionMessageComposer: React.FC<EvolutionMessageComposerProps> = ({
  recipientNumber,
  onMessageSent,
  disabled = false,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('text');
  const [isSending, setIsSending] = useState(false);
  
  // Estados para diferentes tipos de mensagem
  const [textMessage, setTextMessage] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaCaption, setMediaCaption] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  // Estados para localização
  const [location, setLocation] = useState({
    latitude: '',
    longitude: '',
    name: '',
    address: '',
    url: ''
  });
  
  // Estados para contato
  const [contact, setContact] = useState({
    fullName: '',
    phoneNumber: '',
    organization: '',
    email: '',
    url: ''
  });
  
  // Estados para poll
  const [poll, setPoll] = useState({
    name: '',
    selectableCount: 1,
    options: [{ id: '1', text: '' }] as PollOption[]
  });
  
  // Estados para lista
  const [list, setList] = useState({
    title: '',
    description: '',
    buttonText: 'Ver opções',
    footerText: '',
    sections: [{ 
      id: '1', 
      title: 'Seção 1', 
      rows: [{ id: '1', title: '', description: '' }] 
    }] as ListSection[]
  });
  
  // Estados para botões
  const [buttonMessage, setButtonMessage] = useState({
    text: '',
    footerText: '',
    buttons: [{ 
      id: '1', 
      type: 'replyButton' as const, 
      title: '', 
      payload: '' 
    }] as ButtonConfig[]
  });
  
  // Opções gerais
  const [options, setOptions] = useState({
    delay: 0,
    linkPreview: true,
    mentionsEveryOne: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const {
    sendText,
    sendMedia,
    sendLocation,
    sendContact,
    sendSticker,
    sendPoll,
    sendList,
    sendButton,
    formatPhoneNumber,
    isSending: hookIsSending,
    error
  } = useEvolutionSender();

  // Processar upload de arquivo
  const handleFileUpload = useCallback((file: File) => {
    setMediaFile(file);
    
    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Enviar mensagem de texto
  const handleSendText = useCallback(async () => {
    if (!textMessage.trim()) return;
    
    setIsSending(true);
    try {
      const result = await sendText({
        number: formatPhoneNumber(recipientNumber),
        text: textMessage,
        delay: options.delay,
        linkPreview: options.linkPreview,
        mentionsEveryOne: options.mentionsEveryOne
      });
      
      setTextMessage('');
      onMessageSent?.(result);
      
      toast({
        title: "✅ Mensagem enviada",
        description: "Mensagem de texto enviada com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro no envio",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  }, [textMessage, recipientNumber, formatPhoneNumber, sendText, options, onMessageSent, toast]);

  // Enviar mídia
  const handleSendMedia = useCallback(async () => {
    if (!mediaFile) return;
    
    setIsSending(true);
    try {
      // Converter arquivo para base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        let mediatype: 'image' | 'video' | 'audio' | 'document' = 'document';
        if (mediaFile.type.startsWith('image/')) mediatype = 'image';
        else if (mediaFile.type.startsWith('video/')) mediatype = 'video';
        else if (mediaFile.type.startsWith('audio/')) mediatype = 'audio';
        
        const result = await sendMedia({
          number: formatPhoneNumber(recipientNumber),
          mediatype,
          media: base64,
          caption: mediaCaption,
          fileName: mediaFile.name,
          delay: options.delay
        });
        
        setMediaFile(null);
        setMediaCaption('');
        setMediaPreview(null);
        onMessageSent?.(result);
        
        toast({
          title: "✅ Mídia enviada",
          description: `${mediatype} enviada com sucesso`
        });
      };
      reader.readAsDataURL(mediaFile);
    } catch (error: any) {
      toast({
        title: "❌ Erro no envio",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  }, [mediaFile, mediaCaption, recipientNumber, formatPhoneNumber, sendMedia, options, onMessageSent, toast]);

  // Enviar localização
  const handleSendLocation = useCallback(async () => {
    if (!location.latitude || !location.longitude) return;
    
    setIsSending(true);
    try {
      const result = await sendLocation({
        number: formatPhoneNumber(recipientNumber),
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        name: location.name,
        address: location.address,
        url: location.url
      });
      
      setLocation({ latitude: '', longitude: '', name: '', address: '', url: '' });
      onMessageSent?.(result);
      
      toast({
        title: "✅ Localização enviada",
        description: "Localização compartilhada com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro no envio",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  }, [location, recipientNumber, formatPhoneNumber, sendLocation, onMessageSent, toast]);

  // Enviar contato
  const handleSendContact = useCallback(async () => {
    if (!contact.fullName || !contact.phoneNumber) return;
    
    setIsSending(true);
    try {
      const result = await sendContact({
        number: formatPhoneNumber(recipientNumber),
        contact: {
          fullName: contact.fullName,
          wuid: formatPhoneNumber(contact.phoneNumber),
          phoneNumber: contact.phoneNumber,
          organization: contact.organization,
          email: contact.email,
          url: contact.url
        }
      });
      
      setContact({ fullName: '', phoneNumber: '', organization: '', email: '', url: '' });
      onMessageSent?.(result);
      
      toast({
        title: "✅ Contato enviado",
        description: "Contato compartilhado com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro no envio",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  }, [contact, recipientNumber, formatPhoneNumber, sendContact, onMessageSent, toast]);

  // Enviar poll
  const handleSendPoll = useCallback(async () => {
    if (!poll.name || poll.options.length === 0 || !poll.options[0].text) return;
    
    setIsSending(true);
    try {
      const result = await sendPoll({
        number: formatPhoneNumber(recipientNumber),
        poll: {
          name: poll.name,
          selectableCount: poll.selectableCount,
          values: poll.options.filter(opt => opt.text.trim()).map(opt => opt.text)
        }
      });
      
      setPoll({ name: '', selectableCount: 1, options: [{ id: '1', text: '' }] });
      onMessageSent?.(result);
      
      toast({
        title: "✅ Enquete enviada",
        description: "Enquete criada com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro no envio",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  }, [poll, recipientNumber, formatPhoneNumber, sendPoll, onMessageSent, toast]);

  // Enviar lista
  const handleSendList = useCallback(async () => {
    if (!list.title || !list.description || list.sections.length === 0) return;
    
    setIsSending(true);
    try {
      const result = await sendList({
        number: formatPhoneNumber(recipientNumber),
        list: {
          title: list.title,
          description: list.description,
          buttonText: list.buttonText,
          footerText: list.footerText,
          sections: list.sections.filter(section => 
            section.title && section.rows.some(row => row.title)
          ).map(section => ({
            title: section.title,
            rows: section.rows.filter(row => row.title).map((row, index) => ({
              title: row.title,
              description: row.description,
              rowId: `row_${section.id}_${index}`
            }))
          }))
        }
      });
      
      setList({
        title: '',
        description: '',
        buttonText: 'Ver opções',
        footerText: '',
        sections: [{ id: '1', title: 'Seção 1', rows: [{ id: '1', title: '', description: '' }] }]
      });
      onMessageSent?.(result);
      
      toast({
        title: "✅ Lista enviada",
        description: "Lista interativa criada com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro no envio",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  }, [list, recipientNumber, formatPhoneNumber, sendList, onMessageSent, toast]);

  // Enviar botões
  const handleSendButtons = useCallback(async () => {
    if (!buttonMessage.text || buttonMessage.buttons.length === 0) return;
    
    setIsSending(true);
    try {
      const result = await sendButton({
        number: formatPhoneNumber(recipientNumber),
        button: {
          text: buttonMessage.text,
          footerText: buttonMessage.footerText,
          buttons: buttonMessage.buttons.filter(btn => btn.title).map(btn => ({
            type: btn.type,
            title: btn.title,
            payload: btn.payload,
            url: btn.url,
            phoneNumber: btn.phoneNumber
          }))
        }
      });
      
      setButtonMessage({
        text: '',
        footerText: '',
        buttons: [{ id: '1', type: 'replyButton', title: '', payload: '' }]
      });
      onMessageSent?.(result);
      
      toast({
        title: "✅ Botões enviados",
        description: "Mensagem com botões criada com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro no envio",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  }, [buttonMessage, recipientNumber, formatPhoneNumber, sendButton, onMessageSent, toast]);

  // Adicionar opção ao poll
  const addPollOption = useCallback(() => {
    setPoll(prev => ({
      ...prev,
      options: [...prev.options, { id: Date.now().toString(), text: '' }]
    }));
  }, []);

  // Remover opção do poll
  const removePollOption = useCallback((id: string) => {
    setPoll(prev => ({
      ...prev,
      options: prev.options.filter(opt => opt.id !== id)
    }));
  }, []);

  // Adicionar linha à lista
  const addListRow = useCallback((sectionId: string) => {
    setList(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, rows: [...section.rows, { id: Date.now().toString(), title: '', description: '' }] }
          : section
      )
    }));
  }, []);

  // Adicionar botão
  const addButton = useCallback(() => {
    setButtonMessage(prev => ({
      ...prev,
      buttons: [...prev.buttons, { id: Date.now().toString(), type: 'replyButton', title: '', payload: '' }]
    }));
  }, []);

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Composer Evolution API
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Para:</span>
          <Badge variant="outline">{recipientNumber}</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="text" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Texto</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-1">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Mídia</span>
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Local</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-1">
              <Contact className="h-4 w-4" />
              <span className="hidden sm:inline">Contato</span>
            </TabsTrigger>
            <TabsTrigger value="poll" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Enquete</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-1">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Lista</span>
            </TabsTrigger>
            <TabsTrigger value="buttons" className="flex items-center gap-1">
              <MousePointer className="h-4 w-4" />
              <span className="hidden sm:inline">Botões</span>
            </TabsTrigger>
            <TabsTrigger value="sticker" className="flex items-center gap-1">
              <Sticker className="h-4 w-4" />
              <span className="hidden sm:inline">Sticker</span>
            </TabsTrigger>
          </TabsList>

          {/* Opções gerais */}
          <Card className="mt-4">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <Label htmlFor="delay">Delay (ms):</Label>
                  <Input
                    id="delay"
                    type="number"
                    value={options.delay}
                    onChange={(e) => setOptions(prev => ({ ...prev, delay: parseInt(e.target.value) || 0 }))}
                    className="w-20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  <Label htmlFor="linkPreview">Preview de link:</Label>
                  <Switch
                    id="linkPreview"
                    checked={options.linkPreview}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, linkPreview: checked }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <Label htmlFor="mentionsEveryOne">Mencionar todos:</Label>
                  <Switch
                    id="mentionsEveryOne"
                    checked={options.mentionsEveryOne}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, mentionsEveryOne: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aba de texto */}
          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="textMessage">Mensagem de texto</Label>
              <Textarea
                id="textMessage"
                placeholder="Digite sua mensagem..."
                value={textMessage}
                onChange={(e) => setTextMessage(e.target.value)}
                rows={4}
              />
            </div>
            <Button 
              onClick={handleSendText}
              disabled={!textMessage.trim() || isSending || hookIsSending || disabled}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Texto
            </Button>
          </TabsContent>

          {/* Aba de mídia */}
          <TabsContent value="media" className="space-y-4">
            <div className="space-y-2">
              <Label>Arquivo de mídia</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {mediaPreview ? (
                  <div className="space-y-2">
                    <img src={mediaPreview} alt="Preview" className="max-h-32 mx-auto" />
                    <p className="text-sm text-muted-foreground">{mediaFile?.name}</p>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Alterar arquivo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-gray-400" />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      Selecionar arquivo
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mediaCaption">Legenda (opcional)</Label>
              <Input
                id="mediaCaption"
                placeholder="Adicione uma legenda..."
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleSendMedia}
              disabled={!mediaFile || isSending || hookIsSending || disabled}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Mídia
            </Button>
          </TabsContent>

          {/* Aba de localização */}
          <TabsContent value="location" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  placeholder="-23.550520"
                  value={location.latitude}
                  onChange={(e) => setLocation(prev => ({ ...prev, latitude: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  placeholder="-46.633308"
                  value={location.longitude}
                  onChange={(e) => setLocation(prev => ({ ...prev, longitude: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationName">Nome do local</Label>
              <Input
                id="locationName"
                placeholder="Nome do local"
                value={location.name}
                onChange={(e) => setLocation(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationAddress">Endereço</Label>
              <Input
                id="locationAddress"
                placeholder="Endereço completo"
                value={location.address}
                onChange={(e) => setLocation(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <Button 
              onClick={handleSendLocation}
              disabled={!location.latitude || !location.longitude || isSending || hookIsSending || disabled}
              className="w-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Enviar Localização
            </Button>
          </TabsContent>

          {/* Aba de contato */}
          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Nome completo *</Label>
                <Input
                  id="contactName"
                  placeholder="João Silva"
                  value={contact.fullName}
                  onChange={(e) => setContact(prev => ({ ...prev, fullName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Telefone *</Label>
                <Input
                  id="contactPhone"
                  placeholder="+55 11 99999-9999"
                  value={contact.phoneNumber}
                  onChange={(e) => setContact(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactOrganization">Organização</Label>
              <Input
                id="contactOrganization"
                placeholder="Empresa XYZ"
                value={contact.organization}
                onChange={(e) => setContact(prev => ({ ...prev, organization: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="joao@exemplo.com"
                value={contact.email}
                onChange={(e) => setContact(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <Button 
              onClick={handleSendContact}
              disabled={!contact.fullName || !contact.phoneNumber || isSending || hookIsSending || disabled}
              className="w-full"
            >
              <Contact className="h-4 w-4 mr-2" />
              Enviar Contato
            </Button>
          </TabsContent>

          {/* Aba de enquete */}
          <TabsContent value="poll" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pollName">Pergunta da enquete *</Label>
              <Input
                id="pollName"
                placeholder="Qual sua cor favorita?"
                value={poll.name}
                onChange={(e) => setPoll(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pollCount">Máximo de seleções</Label>
              <Input
                id="pollCount"
                type="number"
                min="1"
                value={poll.selectableCount}
                onChange={(e) => setPoll(prev => ({ ...prev, selectableCount: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Opções *</Label>
              {poll.options.map((option, index) => (
                <div key={option.id} className="flex gap-2">
                  <Input
                    placeholder={`Opção ${index + 1}`}
                    value={option.text}
                    onChange={(e) => setPoll(prev => ({
                      ...prev,
                      options: prev.options.map(opt =>
                        opt.id === option.id ? { ...opt, text: e.target.value } : opt
                      )
                    }))}
                  />
                  {poll.options.length > 1 && (
                    <Button variant="outline" size="icon" onClick={() => removePollOption(option.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={addPollOption}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar opção
              </Button>
            </div>
            <Button 
              onClick={handleSendPoll}
              disabled={!poll.name || !poll.options[0]?.text || isSending || hookIsSending || disabled}
              className="w-full"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Enviar Enquete
            </Button>
          </TabsContent>

          {/* Aba de lista */}
          <TabsContent value="list" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="listTitle">Título da lista *</Label>
              <Input
                id="listTitle"
                placeholder="Escolha uma opção"
                value={list.title}
                onChange={(e) => setList(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="listDescription">Descrição *</Label>
              <Textarea
                id="listDescription"
                placeholder="Selecione uma das opções abaixo:"
                value={list.description}
                onChange={(e) => setList(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="listButtonText">Texto do botão</Label>
                <Input
                  id="listButtonText"
                  placeholder="Ver opções"
                  value={list.buttonText}
                  onChange={(e) => setList(prev => ({ ...prev, buttonText: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="listFooter">Rodapé</Label>
                <Input
                  id="listFooter"
                  placeholder="Texto do rodapé"
                  value={list.footerText}
                  onChange={(e) => setList(prev => ({ ...prev, footerText: e.target.value }))}
                />
              </div>
            </div>
            
            {/* Seções da lista */}
            <div className="space-y-4">
              <Label>Seções da lista</Label>
              {list.sections.map((section, sectionIndex) => (
                <Card key={section.id} className="p-4">
                  <div className="space-y-3">
                    <Input
                      placeholder={`Título da seção ${sectionIndex + 1}`}
                      value={section.title}
                      onChange={(e) => setList(prev => ({
                        ...prev,
                        sections: prev.sections.map(sec =>
                          sec.id === section.id ? { ...sec, title: e.target.value } : sec
                        )
                      }))}
                    />
                    
                    {/* Itens da seção */}
                    {section.rows.map((row, rowIndex) => (
                      <div key={row.id} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 border rounded">
                        <Input
                          placeholder={`Item ${rowIndex + 1} - Título`}
                          value={row.title}
                          onChange={(e) => setList(prev => ({
                            ...prev,
                            sections: prev.sections.map(sec =>
                              sec.id === section.id
                                ? {
                                    ...sec,
                                    rows: sec.rows.map(r =>
                                      r.id === row.id ? { ...r, title: e.target.value } : r
                                    )
                                  }
                                : sec
                            )
                          }))}
                        />
                        <Input
                          placeholder="Descrição (opcional)"
                          value={row.description}
                          onChange={(e) => setList(prev => ({
                            ...prev,
                            sections: prev.sections.map(sec =>
                              sec.id === section.id
                                ? {
                                    ...sec,
                                    rows: sec.rows.map(r =>
                                      r.id === row.id ? { ...r, description: e.target.value } : r
                                    )
                                  }
                                : sec
                            )
                          }))}
                        />
                      </div>
                    ))}
                    
                    <Button variant="outline" size="sm" onClick={() => addListRow(section.id)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar item
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            
            <Button 
              onClick={handleSendList}
              disabled={!list.title || !list.description || isSending || hookIsSending || disabled}
              className="w-full"
            >
              <List className="h-4 w-4 mr-2" />
              Enviar Lista
            </Button>
          </TabsContent>

          {/* Aba de botões */}
          <TabsContent value="buttons" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buttonText">Texto da mensagem *</Label>
              <Textarea
                id="buttonText"
                placeholder="Digite a mensagem que aparecerá acima dos botões"
                value={buttonMessage.text}
                onChange={(e) => setButtonMessage(prev => ({ ...prev, text: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buttonFooter">Rodapé</Label>
              <Input
                id="buttonFooter"
                placeholder="Texto do rodapé (opcional)"
                value={buttonMessage.footerText}
                onChange={(e) => setButtonMessage(prev => ({ ...prev, footerText: e.target.value }))}
              />
            </div>
            
            {/* Botões */}
            <div className="space-y-4">
              <Label>Botões</Label>
              {buttonMessage.buttons.map((button, index) => (
                <Card key={button.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <select
                        value={button.type}
                        onChange={(e) => setButtonMessage(prev => ({
                          ...prev,
                          buttons: prev.buttons.map(btn =>
                            btn.id === button.id 
                              ? { ...btn, type: e.target.value as any, payload: '', url: '', phoneNumber: '' }
                              : btn
                          )
                        }))}
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="replyButton">Resposta</option>
                        <option value="urlButton">URL</option>
                        <option value="callButton">Ligação</option>
                      </select>
                      <Input
                        placeholder={`Título do botão ${index + 1}`}
                        value={button.title}
                        onChange={(e) => setButtonMessage(prev => ({
                          ...prev,
                          buttons: prev.buttons.map(btn =>
                            btn.id === button.id ? { ...btn, title: e.target.value } : btn
                          )
                        }))}
                      />
                      {buttonMessage.buttons.length > 1 && (
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setButtonMessage(prev => ({
                            ...prev,
                            buttons: prev.buttons.filter(btn => btn.id !== button.id)
                          }))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {button.type === 'replyButton' && (
                      <Input
                        placeholder="Texto de resposta"
                        value={button.payload || ''}
                        onChange={(e) => setButtonMessage(prev => ({
                          ...prev,
                          buttons: prev.buttons.map(btn =>
                            btn.id === button.id ? { ...btn, payload: e.target.value } : btn
                          )
                        }))}
                      />
                    )}
                    
                    {button.type === 'urlButton' && (
                      <Input
                        placeholder="URL (ex: https://exemplo.com)"
                        value={button.url || ''}
                        onChange={(e) => setButtonMessage(prev => ({
                          ...prev,
                          buttons: prev.buttons.map(btn =>
                            btn.id === button.id ? { ...btn, url: e.target.value } : btn
                          )
                        }))}
                      />
                    )}
                    
                    {button.type === 'callButton' && (
                      <Input
                        placeholder="Número de telefone (ex: +5511999999999)"
                        value={button.phoneNumber || ''}
                        onChange={(e) => setButtonMessage(prev => ({
                          ...prev,
                          buttons: prev.buttons.map(btn =>
                            btn.id === button.id ? { ...btn, phoneNumber: e.target.value } : btn
                          )
                        }))}
                      />
                    )}
                  </div>
                </Card>
              ))}
              
              {buttonMessage.buttons.length < 3 && (
                <Button variant="outline" onClick={addButton}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar botão
                </Button>
              )}
            </div>
            
            <Button 
              onClick={handleSendButtons}
              disabled={!buttonMessage.text || !buttonMessage.buttons[0]?.title || isSending || hookIsSending || disabled}
              className="w-full"
            >
              <MousePointer className="h-4 w-4 mr-2" />
              Enviar Botões
            </Button>
          </TabsContent>

          {/* Aba de sticker */}
          <TabsContent value="sticker" className="space-y-4">
            <div className="space-y-2">
              <Label>Arquivo de sticker</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {mediaPreview && mediaFile?.type.startsWith('image/') ? (
                  <div className="space-y-2">
                    <img src={mediaPreview} alt="Sticker Preview" className="max-h-32 mx-auto" />
                    <p className="text-sm text-muted-foreground">{mediaFile?.name}</p>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Alterar sticker
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Sticker className="h-8 w-8 mx-auto text-gray-400" />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      Selecionar sticker
                    </Button>
                    <p className="text-xs text-muted-foreground">Apenas imagens PNG/JPEG</p>
                  </div>
                )}
              </div>
            </div>
            <Button 
              onClick={async () => {
                if (!mediaFile || !mediaFile.type.startsWith('image/')) return;
                
                setIsSending(true);
                try {
                  const reader = new FileReader();
                  reader.onload = async (e) => {
                    const base64 = e.target?.result as string;
                    
                    const result = await sendSticker({
                      number: formatPhoneNumber(recipientNumber),
                      sticker: base64
                    });
                    
                    setMediaFile(null);
                    setMediaPreview(null);
                    onMessageSent?.(result);
                    
                    toast({
                      title: "✅ Sticker enviado",
                      description: "Sticker enviado com sucesso"
                    });
                  };
                  reader.readAsDataURL(mediaFile);
                } catch (error: any) {
                  toast({
                    title: "❌ Erro no envio",
                    description: error.message,
                    variant: "destructive"
                  });
                } finally {
                  setIsSending(false);
                }
              }}
              disabled={!mediaFile || !mediaFile.type.startsWith('image/') || isSending || hookIsSending || disabled}
              className="w-full"
            >
              <Sticker className="h-4 w-4 mr-2" />
              Enviar Sticker
            </Button>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {(isSending || hookIsSending) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-600">Enviando mensagem...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 