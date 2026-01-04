// 临时内存存储（用于数据库未配置时的降级方案）
interface TempReport {
  id: number;
  user_id: number;
  professions: string[];
  file_url: string;
  file_name: string;
  file_size: number;
  status: string;
  created_at: string;
  updated_at: string;
}

class TempStorage {
  private reports: Map<number, TempReport> = new Map();
  private idCounter: number = 1;

  createReport(data: Omit<TempReport, 'id' | 'created_at' | 'updated_at'>): TempReport {
    const id = this.idCounter++;
    const now = new Date().toISOString();
    const report: TempReport = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
    };
    this.reports.set(id, report);
    return report;
  }

  getReport(id: number): TempReport | undefined {
    return this.reports.get(id);
  }

  getAllReports(): TempReport[] {
    return Array.from(this.reports.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  updateReport(id: number, updates: Partial<TempReport>): TempReport | undefined {
    const report = this.reports.get(id);
    if (!report) return undefined;

    const updated = {
      ...report,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.reports.set(id, updated);
    return updated;
  }

  deleteReport(id: number): boolean {
    return this.reports.delete(id);
  }
}

export const tempStorage = new TempStorage();
