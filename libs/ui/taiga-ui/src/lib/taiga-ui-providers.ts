import { Provider, signal } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  tuiButtonOptionsProvider,
  tuiCheckboxOptionsProvider,
  tuiRadioOptionsProvider,
  tuiScrollbarOptionsProvider,
  tuiTextfieldOptionsProvider,
  tuiValidationErrorsProvider,
} from '@taiga-ui/core';
import { tuiSwitchOptionsProvider, tuiTextareaOptionsProvider } from '@taiga-ui/kit';
import { TUI_LANGUAGE, TUI_RUSSIAN_LANGUAGE } from '@taiga-ui/i18n';
import { provideTaiga, tuiAssetsPathProvider } from '@taiga-ui/core';

export const taigaUIProviders = [
  provideAnimations(),
  provideTaiga(),
  tuiAssetsPathProvider('/assets/taiga-ui/icons'),
  tuiValidationErrorsProvider({
    required: $localize`Заполните поле`,
    email: $localize`Введите действительный адрес электронной почты`,
    fileAccept: $localize`Недопустимое расширение файла`,
    filesRequired: $localize`Файлы не приложены`,
    isActive: $localize`Поле не должно содержать неактивные элементы`,
    inactiveElement: $localize`Поле не должно содержать неактивные элементы`,
    invalidEmails: (message) => `Невалидные почтовые ящики: ${message}`,
    isEmail: () => $localize`Указано некорректное значение`,
    isDefault: $localize`По умолчанию может быть выбрано только одно значение`,
    message: (message: string) => message,
  }),
  tuiTextfieldOptionsProvider({ size: signal('s') }),
  tuiTextareaOptionsProvider({ max: 20 }),
  tuiButtonOptionsProvider({ size: 's' }),
  tuiCheckboxOptionsProvider({ size: 's' }),
  tuiRadioOptionsProvider({ size: 's' }),
  tuiScrollbarOptionsProvider({ mode: 'native' }),
  tuiSwitchOptionsProvider({ size: 'm' }),
  { provide: TUI_LANGUAGE, useValue: signal(TUI_RUSSIAN_LANGUAGE) },
] satisfies Provider[];
