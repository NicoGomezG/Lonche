import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface MenuItem {
  name: string;
  desc: string;
  price: string;
}

interface MenuCategory {
  cat: string;
  items: MenuItem[];
}

interface MenuTab {
  id: string;
  label: string;
  categories: MenuCategory[];
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  activeTab = 'desayuno';

  tabs: MenuTab[] = [
    {
      id: 'desayuno',
      label: 'Desayunos',
      categories: [
        {
          cat: 'Desayunos / Brunch',
          items: [
            { name: 'Paila de huevos', desc: '3 huevos y 2 tostadas con semillas', price: '$4.000' },
            { name: 'Avocado toast', desc: 'Huevo benedictino, tomate cherry, palta y sésamo', price: '$4.500' },
            { name: 'Omelette champiñón', desc: 'Champiñón, ciboulette y tomate cherry', price: '$5.000' },
            { name: 'Omelette queso palta', desc: 'Queso, palta, tomate cherry y espinaca', price: '$5.000' },
          ]
        },
        {
          cat: 'Sándwiches (ciabatta o croissant)',
          items: [
            { name: 'Jamón queso', desc: '', price: '$4.000' },
            { name: 'Huevo tocino', desc: '', price: '$5.000' },
            { name: 'Palta tocino', desc: '', price: '$5.500' },
            { name: 'Ave palta', desc: '', price: '$5.500' },
            { name: 'Ave mayo', desc: '', price: '$5.500' },
            { name: 'Churrasco queso', desc: '', price: '$5.500' },
            { name: 'Lomito queso', desc: '', price: '$5.500' },
            { name: 'Churrasco con 2 agregados', desc: '', price: '$7.000' },
            { name: 'Lomito con 2 agregados', desc: '', price: '$7.000' },
          ]
        },
        {
          cat: 'Sándwiches autor (ciabatta o croissant)',
          items: [
            { name: 'Salmón ahumado', desc: 'Queso crema, tomate cherry, alcaparra frita y rúcula', price: '$8.000' },
            { name: 'Jamón serrano', desc: 'Queso crema, rúcula, aceituna negra y aceite de oliva', price: '$8.000' },
          ]
        }
      ]
    },
    {
      id: 'almuerzo',
      label: 'Almuerzos',
      categories: [
        {
          cat: 'Menú del día',
          items: [
            { name: 'Menú del día', desc: 'Incluye ensalada y tostadas', price: '$8.000' },
          ]
        },
        {
          cat: 'Bowl ensalada',
          items: [
            { name: 'Ensalada César', desc: 'Mix green, pollo, parmesano, dressing de la casa con crutones', price: '$8.000' },
            { name: 'Salmón ahumado de autor', desc: 'Mix green, salmón, tomates cherry asado, alcaparra frita, dressing y crutones', price: '$9.000' },
            { name: 'Mediterránea de autor', desc: 'Mix green, jamón serrano, queso cabra, aceitunas, cebolla morada, tomate asado, encurtido', price: '$9.000' },
          ]
        },
        {
          cat: 'Sopas y cremas',
          items: [
            { name: 'Consomé', desc: 'Caldo proteína, verdura, huevo con crutones', price: '$3.000' },
            { name: 'Crema de verduras', desc: 'Mix de verduras frescas con crutones', price: '$3.500' },
            { name: 'Crema de zapallo', desc: 'Zapallo horneado con crutones', price: '$4.000' },
          ]
        },
        {
          cat: 'Otros',
          items: [
            { name: 'Empanada de pino', desc: 'Masa casera y pino', price: '$3.000' },
            { name: 'Empanadas variedades', desc: 'Consulte disponibilidad', price: '$3.000' },
          ]
        }
      ]
    },
    {
      id: 'bebestibles',
      label: 'Bebestibles',
      categories: [
        {
          cat: 'Frío',
          items: [
            { name: 'Bebidas en lata', desc: 'Coca-Cola, Fanta y Sprite', price: '$2.000' },
            { name: 'Jugo en lata', desc: 'Piña, piña-coco y durazno', price: '$2.000' },
            { name: 'Agua', desc: 'Con y sin gas', price: '$1.500' },
          ]
        },
        {
          cat: 'Caliente',
          items: [
            { name: 'Café americano', desc: 'Café de grano', price: '$2.500' },
            { name: 'Café vainilla', desc: 'Variedad Starbucks', price: '$2.500' },
            { name: 'Té negro', desc: 'Agrega limón, miel, jengibre o canela — gratis', price: '$1.500' },
            { name: 'Té de la casa', desc: 'Té de hoja con mix de hierbas', price: '$2.000' },
          ]
        }
      ]
    },
    {
      id: 'dulces',
      label: 'Dulces',
      categories: [
        {
          cat: 'Dulces y otros',
          items: [
            { name: 'Yogurt granola', desc: 'Yogurt, granola, cranberries y/o chips de chocolate', price: '$3.000' },
            { name: 'Panqueque de la casa', desc: 'Con manjar o mermelada casera y azúcar flor', price: '$3.000' },
            { name: 'Copa helado San Francisco', desc: 'Variedades con y sin azúcar', price: '$4.000' },
          ]
        }
      ]
    }
  ];

  setTab(id: string) {
    this.activeTab = id;
  }

  openWhatsapp(msg: string) {
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/56998329194?text=${encoded}`, '_blank');
  }

  openRappi() {
    window.open('https://www.rappi.cl', '_blank');
  }

  openMaps() {
    window.open('https://maps.google.com/?q=Simon+Bolivar+2644+Nuñoa+Santiago', '_blank');
  }

  openInstagram() {
    window.open('https://instagram.com/lonchecl', '_blank');
  }

  scrollToMenu() {
    document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
  }
}
