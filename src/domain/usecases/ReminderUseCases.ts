import { Reminder } from '../entities/Reminder';
import { ReminderRepository } from '../repositories/ReminderRepository';

export class GetAllRemindersUseCase {
  constructor(private repository: ReminderRepository) {}

  async execute(): Promise<Reminder[]> {
    return this.repository.getAll();
  }
}

export class GetReminderByIdUseCase {
  constructor(private repository: ReminderRepository) {}

  async execute(id: string): Promise<Reminder | null> {
    return this.repository.getById(id);
  }
}

export class CreateReminderUseCase {
  constructor(private repository: ReminderRepository) {}

  async execute(reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reminder> {
    return this.repository.create(reminder);
  }
}

export class UpdateReminderUseCase {
  constructor(private repository: ReminderRepository) {}

  async execute(id: string, reminder: Partial<Reminder>): Promise<Reminder> {
    return this.repository.update(id, reminder);
  }
}

export class DeleteReminderUseCase {
  constructor(private repository: ReminderRepository) {}

  async execute(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}

export class GetRemindersByDateUseCase {
  constructor(private repository: ReminderRepository) {}

  async execute(date: Date): Promise<Reminder[]> {
    return this.repository.getByDate(date);
  }
}

export class GetUpcomingRemindersUseCase {
  constructor(private repository: ReminderRepository) {}

  async execute(): Promise<Reminder[]> {
    return this.repository.getUpcoming();
  }
}

export class ToggleReminderCompleteUseCase {
  constructor(private repository: ReminderRepository) {}

  async execute(id: string): Promise<Reminder> {
    return this.repository.toggleComplete(id);
  }
}
