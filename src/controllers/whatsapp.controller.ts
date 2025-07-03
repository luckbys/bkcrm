import { Request, Response } from 'express';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import { WhatsAppInstance, CreateInstanceParams, WhatsAppSettings } from '../types/whatsapp.types';

// Cliente axios para Evolution API
const evolutionApi = axios.create({
  baseURL: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
    'apikey': process.env.EVOLUTION_API_KEY
  }
});

export class WhatsAppController {
  // Listar todas as instâncias
  async listInstances(req: Request, res: Response) {
    try {
      const instances = await prisma.whatsappInstance.findMany({
        include: {
          department: true
        }
      });

      // Buscar status atual de cada instância na Evolution API
      const instancesWithStatus = await Promise.all(
        instances.map(async (instance) => {
          try {
            const { data } = await evolutionApi.get(`/instance/connectionState/${instance.instanceName}`);
            return {
              ...instance,
              status: data.state
            };
          } catch (error) {
            return {
              ...instance,
              status: 'disconnected'
            };
          }
        })
      );

      return res.json(instancesWithStatus);
    } catch (error) {
      console.error('Erro ao listar instâncias:', error);
      return res.status(500).json({ 
        error: 'Erro ao buscar instâncias do WhatsApp' 
      });
    }
  }

  // Criar nova instância
  async createInstance(req: Request, res: Response) {
    const { departmentId, ...config }: CreateInstanceParams & { departmentId: string } = req.body;

    try {
      // Verificar se já existe instância para este departamento
      const existingInstance = await prisma.whatsappInstance.findFirst({
        where: { departmentId }
      });

      if (existingInstance) {
        return res.status(400).json({
          error: 'Este departamento já possui uma instância do WhatsApp'
        });
      }

      // Criar instância na Evolution API
      const { data: evolutionInstance } = await evolutionApi.post('/instance/create', {
        instanceName: config.instanceName,
        token: config.token,
        qrcode: true,
        ...config
      });

      // Salvar no banco
      const instance = await prisma.whatsappInstance.create({
        data: {
          instanceName: config.instanceName,
          departmentId,
          webhookUrl: evolutionInstance.webhook?.url,
          serverUrl: process.env.EVOLUTION_API_URL,
          integration: {
            integration: config.integration || 'WHATSAPP-BAILEYS'
          }
        },
        include: {
          department: true
        }
      });

      return res.status(201).json(instance);
    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      return res.status(500).json({ 
        error: error.response?.data?.message || 'Erro ao criar instância do WhatsApp' 
      });
    }
  }

  // Conectar instância (gerar QR)
  async connectInstance(req: Request, res: Response) {
    const { instanceName } = req.params;

    try {
      // Verificar se instância existe
      const instance = await prisma.whatsappInstance.findFirst({
        where: { instanceName }
      });

      if (!instance) {
        return res.status(404).json({
          error: 'Instância não encontrada'
        });
      }

      // Iniciar conexão na Evolution API
      await evolutionApi.post(`/instance/connect/${instanceName}`);

      return res.json({ success: true });
    } catch (error: any) {
      console.error('Erro ao conectar instância:', error);
      return res.status(500).json({ 
        error: error.response?.data?.message || 'Erro ao conectar instância do WhatsApp' 
      });
    }
  }

  // Buscar QR Code
  async getQRCode(req: Request, res: Response) {
    const { instanceName } = req.params;

    try {
      // Verificar se instância existe
      const instance = await prisma.whatsappInstance.findFirst({
        where: { instanceName }
      });

      if (!instance) {
        return res.status(404).json({
          error: 'Instância não encontrada'
        });
      }

      // Buscar QR na Evolution API
      const { data } = await evolutionApi.get(`/instance/qrcode/${instanceName}`);

      return res.json({ 
        base64: data.qrcode?.base64 
      });
    } catch (error: any) {
      console.error('Erro ao buscar QR Code:', error);
      return res.status(500).json({ 
        error: error.response?.data?.message || 'Erro ao gerar QR Code' 
      });
    }
  }

  // Atualizar configurações
  async updateSettings(req: Request, res: Response) {
    const { instanceName } = req.params;
    const settings: Partial<WhatsAppSettings> = req.body;

    try {
      // Verificar se instância existe
      const instance = await prisma.whatsappInstance.findFirst({
        where: { instanceName }
      });

      if (!instance) {
        return res.status(404).json({
          error: 'Instância não encontrada'
        });
      }

      // Atualizar na Evolution API
      await evolutionApi.put(`/instance/settings/${instanceName}`, settings);

      return res.json({ success: true });
    } catch (error: any) {
      console.error('Erro ao atualizar configurações:', error);
      return res.status(500).json({ 
        error: error.response?.data?.message || 'Erro ao atualizar configurações' 
      });
    }
  }

  // Deletar instância
  async deleteInstance(req: Request, res: Response) {
    const { instanceId } = req.params;

    try {
      // Buscar instância
      const instance = await prisma.whatsappInstance.findUnique({
        where: { id: instanceId }
      });

      if (!instance) {
        return res.status(404).json({
          error: 'Instância não encontrada'
        });
      }

      // Deletar na Evolution API
      await evolutionApi.delete(`/instance/delete/${instance.instanceName}`);

      // Deletar no banco
      await prisma.whatsappInstance.delete({
        where: { id: instanceId }
      });

      return res.json({ success: true });
    } catch (error: any) {
      console.error('Erro ao deletar instância:', error);
      return res.status(500).json({ 
        error: error.response?.data?.message || 'Erro ao remover instância do WhatsApp' 
      });
    }
  }
} 