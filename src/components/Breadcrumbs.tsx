import { Link, useLocation } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const { pathname } = useLocation();

  return (
    <nav className="breadcrumb" aria-label="面包屑导航">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const target = item.to ?? pathname;
          return (
            <li key={`${item.label}-${index}`}>
              <Link to={target} aria-current={isLast ? "page" : undefined}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
