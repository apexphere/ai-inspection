import {
  createCompany,
  getCompanyById,
  listCompanies,
  updateCompany,
  deleteCompany,
  type CreateCompanyInput,
  type UpdateCompanyInput,
} from '../repositories/prisma/company.js';

export class CompanyService {
  async create(data: CreateCompanyInput) {
    return createCompany(data);
  }

  async getById(id: string) {
    const company = await getCompanyById(id);
    if (!company) {
      throw new Error('Company not found');
    }
    return company;
  }

  async list() {
    return listCompanies();
  }

  async update(id: string, data: UpdateCompanyInput) {
    await this.getById(id); // Verify exists
    return updateCompany(id, data);
  }

  async delete(id: string) {
    await this.getById(id); // Verify exists
    return deleteCompany(id);
  }

  async updateLogo(id: string, logoPath: string) {
    await this.getById(id); // Verify exists
    return updateCompany(id, { logoPath });
  }
}
