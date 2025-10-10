import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, TablesDB } from 'node-appwrite';

@Injectable()
export class AppwriteService {
  private client: Client;
  private db: TablesDB;
  private databaseId: string;

  constructor(private readonly configService: ConfigService) {
    const projectId = this.configService.get<string>('APPWRITE_PROJECT_ID');
    const projectEndpoint = this.configService.get<string>('APPWRITE_ENDPOINT');
    const apiKey = this.configService.get<string>('APPWRITE_API_KEY');
    const databaseId = this.configService.get<string>('APPWRITE_DATABASE_ID');
    if (!projectId || !projectEndpoint || !apiKey || !databaseId) {
      throw new Error(
        'APPWRITE_PROJECT_ID, APPWRITE_ENDPOINT, APPWRITE_API_KEY, and APPWRITE_DATABASE_ID must be defined in environment variables',
      );
    }
    this.databaseId = databaseId;

    this.client = new Client()
      .setEndpoint(projectEndpoint)
      .setProject(projectId)
      .setKey(apiKey);

    this.db = new TablesDB(this.client);
  }

  getDb() {
    return this.db;
  }

  getDatabaseId() {
    return this.databaseId;
  }
}
