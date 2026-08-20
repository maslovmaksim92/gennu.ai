/* eslint-disable @angular-eslint/no-input-rename */
/* eslint-disable @typescript-eslint/prefer-function-type */
/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  Renderer2,
  NgZone,
  EmbeddedViewRef,
  inject,
  contentChildren,
  Injector,
  Injectable,
  effect,
  OnDestroy,
  input,
  assertInInjectionContext,
} from '@angular/core';

export interface RenderData {
  model: unknown;
  index: number;
  elementContainer: Element;
}

export interface CellRenderFn {
  (name: string, data: RenderData): unknown[];
}

export function injectCellRender() {
  assertInInjectionContext(injectCellRender);
  const templateHost = inject(GridTemplateHostService);
  return (name: string, data: RenderData) => {
    const template = templateHost.getTemplate(name);
    return template?.render(data);
  };
}

@Injectable()
export class GridTemplateHostService implements OnDestroy {
  #tempalates?: Set<CellTemplateDirective>;

  ngOnDestroy() {
    this.clear();
  }

  public clear(): void {
    this.#tempalates?.clear();
  }

  public setTemplates(tempalates: readonly CellTemplateDirective[]): void {
    this.#tempalates = new Set(tempalates);
  }

  public getTemplate(name: string) {
    for (const item of this.#tempalates ?? []) {
      if (item.name() === name) {
        return item;
      }
    }
    return null;
  }
}

@Directive({
  selector: '[cellTemplateHost]',
})
export class CellTemplateHostDirective {
  private readonly cellTemplates = contentChildren(CellTemplateDirective);

  constructor() {
    const hostService = inject(GridTemplateHostService);
    effect((cleanUp) => {
      hostService.setTemplates(this.cellTemplates());
      cleanUp(() => hostService.clear());
    });
  }

  /*
    this.template.render({
      container: document.querySelector('.selector')
    });
  */
  public render(name: string, data: RenderData) {
    const template = this.cellTemplates().find((c) => c.name() === name);
    return template?.render(data);
  }
}

@Directive({
  selector: '[cellTemplate]',
})
export class CellTemplateDirective {
  private readonly renderer = inject(Renderer2);
  private readonly zone = inject(NgZone);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly templateRef = inject(TemplateRef<unknown>);
  readonly name = input<string>(undefined, { alias: 'cellTemplateOf' });

  private renderTemplate({ index, model, elementContainer }: RenderData): EmbeddedViewRef<unknown> {
    const childView = this.viewContainerRef.createEmbeddedView(this.templateRef, {
      index: index,
      $implicit: model,
    });

    if (elementContainer) {
      childView.rootNodes.forEach((element) => {
        this.renderer.appendChild(elementContainer, element);
      });
    }

    return childView;
  }

  render(renderData: RenderData): unknown[] {
    let childView: EmbeddedViewRef<unknown>;
    if (this.zone.isStable) {
      childView = this.zone.run(() => this.renderTemplate(renderData));
    } else {
      childView = this.renderTemplate(renderData);
    }

    childView.detectChanges();
    return childView.rootNodes;
  }
}
