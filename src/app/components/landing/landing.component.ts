import { Component, ElementRef, NgZone, OnDestroy, afterNextRender } from '@angular/core';
import menuData from '../../../menu.json';

interface MenuItem {
  name: string;
  desc: string;
  price: string;
}

interface MenuCategory {
  cat: string;
  items: MenuItem[];
}

interface MenuGroup {
  id: string;
  short: string;
  title: string;
  count: number;
  showCatTitles: boolean;
  categories: MenuCategory[];
}

function formatPrice(price: number | null): string {
  return price == null ? 'A consultar' : '$' + String(price).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const PHONE = '56998329194';

@Component({
  selector: 'app-landing',
  standalone: true,
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnDestroy {
  // La carta vive en src/menu.json (fuente única). Ver README → "Actualizar la carta".
  readonly groups: MenuGroup[] = menuData.groups.map(g => ({
    id: g.id,
    short: g.short,
    title: g.title,
    count: g.categories.reduce((n, c) => n + c.items.length, 0),
    showCatTitles: g.categories.length > 1,
    categories: g.categories.map(c => ({
      cat: c.cat,
      items: c.items.map(i => ({ name: i.name, desc: i.desc, price: formatPrice(i.price) }))
    }))
  }));

  readonly hours = `${menuData.hours.label}, ${menuData.hours.opens} a ${menuData.hours.closes} hrs`;

  readonly menuDelDia = this.findItem('Menú del día');

  readonly links = {
    whatsappOrder: this.wa('Hola Lonche! Quiero hacer un pedido 🙌'),
    whatsappPickup: this.wa('Hola! Quiero hacer un pick up 🙌'),
    whatsappQuestion: this.wa('Hola Lonche! Tengo una consulta 👋'),
    rappi: 'https://www.rappi.cl/restaurantes/900117561-lonche',
    maps: 'https://maps.google.com/?q=Simon+Bolivar+2644+Nuñoa+Santiago',
    instagram: 'https://instagram.com/lonchecl',
    phone: `tel:+${PHONE}`,
    pdf: 'assets/menu.pdf',
  };

  activeGroup = this.groups[0].id;
  navMoreLeft = false;
  navMoreRight = true;
  private observer?: IntersectionObserver;

  constructor(host: ElementRef<HTMLElement>, zone: NgZone) {
    // Solo en el navegador (no durante el prerender): resalta la sección visible en el índice.
    afterNextRender(() => {
      const nav = host.nativeElement.querySelector<HTMLElement>('.carta-nav');
      if (nav) zone.run(() => this.updateNavHints(nav));
      if (!('IntersectionObserver' in window)) return;
      this.observer = new IntersectionObserver(
        entries => {
          const visible = entries.filter(e => e.isIntersecting);
          // afterNextRender corre fuera de la zona: volvemos a ella para que se actualice la vista.
          if (visible.length) zone.run(() => this.setActive(visible[0].target.id));
        },
        { rootMargin: '-15% 0px -80% 0px' }
      );
      host.nativeElement.querySelectorAll('.menu-group').forEach(el => this.observer!.observe(el));
    });
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  /**
   * Móvil: la carta funciona como pestañas (solo se ve la sección elegida; las demás siguen en el
   * HTML para SEO). Escritorio: se deja el comportamiento normal del enlace (scroll a la sección).
   */
  selectGroup(id: string, ev?: Event) {
    if (!window.matchMedia('(max-width: 899px)').matches) return;
    ev?.preventDefault();
    this.setActive(id);
    const body = document.querySelector<HTMLElement>('.carta-body');
    const nav = document.querySelector<HTMLElement>('.carta-nav-wrap');
    if (body) {
      const top = body.getBoundingClientRect().top + window.scrollY - (nav?.offsetHeight ?? 0);
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  /** Muestra u oculta los degradados/flecha de la barra de chips según cuánto queda por deslizar. */
  updateNavHints(target: EventTarget | null) {
    const el = target as HTMLElement | null;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    this.navMoreLeft = el.scrollLeft > 4;
    this.navMoreRight = max > 4 && el.scrollLeft < max - 4;
  }

  setActive(id: string) {
    if (this.activeGroup === id) return;
    this.activeGroup = id;
    // Mantiene visible el chip activo en la barra horizontal (móvil). Se desplaza solo
    // la barra, no la página, para no cortar el scroll suave al tocar un chip.
    const chip = document.getElementById('chip-' + id);
    const nav = chip?.parentElement;
    if (chip && nav && nav.scrollWidth > nav.clientWidth) {
      nav.scrollTo({ left: chip.offsetLeft - nav.clientWidth / 2 + chip.offsetWidth / 2, behavior: 'smooth' });
    }
  }

  private findItem(name: string): MenuItem | undefined {
    for (const g of this.groups) for (const c of g.categories) {
      const item = c.items.find(i => i.name === name);
      if (item) return item;
    }
    return undefined;
  }

  private wa(msg: string) {
    return `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;
  }
}
