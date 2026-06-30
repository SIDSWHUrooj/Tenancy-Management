// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import{ BuildingTabComponent } from './demo/pages/invoice-entry/tabs/building-tab/building-tab.component';

import { InvoiceEntryComponent } from './demo/pages/invoice-entry/invoice-entry.component';
import { AdminLayout } from './theme/layouts/admin-layout/admin-layout.component';
import { GuestLayoutComponent } from './theme/layouts/guest-layout/guest-layout.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      {
        path: '',
        redirectTo: '/dashboard/default',
        pathMatch: 'full'
      },
      {
        path: 'dashboard/default',
        loadComponent: () => import('./demo/dashboard/default/default.component').then((c) => c.DefaultComponent)
      },
      {
        path: 'typography',
        loadComponent: () => import('./demo/component/basic-component/typography/typography.component').then((c) => c.TypographyComponent)
      },
      {
        path: 'color',
        loadComponent: () => import('./demo/component/basic-component/color/color.component').then((c) => c.ColorComponent)
      },
      {
        path: 'sample-page',
        loadComponent: () => import('./demo/others/sample-page/sample-page.component').then((c) => c.SamplePageComponent)
      },
     {
  path: 'invoice-entry',
  component: InvoiceEntryComponent,
  children: [
    {
      path: 'building',
      loadComponent: () =>
        import('./demo/pages/invoice-entry/tabs/building-tab/building-tab.component')
          .then(m => m.BuildingTabComponent)
    },
    {
      path: 'tax',
      loadComponent: () =>
        import('./demo/pages/invoice-entry/tabs/tax-tab/tax-tab.component')
          .then(m => m.TaxTabComponent)
    },
    {
      path: 'totals',
      loadComponent: () =>
        import('./demo/pages/invoice-entry/tabs/totals-tab/totals-tab.component')
          .then(m => m.TotalsTabComponent)
    },
  
  ]
}, {
  path: 'receipt-entry',
  loadComponent: () =>
    import('./demo/pages/receipt-entry/receipt-entry.component')
      .then(m => m.ReceiptEntryComponent)
}
    ]
  },
  {
    path: '',
    component: GuestLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./demo/pages/authentication/auth-login/auth-login.component').then((c) => c.AuthLoginComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./demo/pages/authentication/auth-register/auth-register.component').then((c) => c.AuthRegisterComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
