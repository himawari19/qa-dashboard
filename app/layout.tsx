import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppWrapper } from "@/components/app-wrapper";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "QA Daily Hub | Quality Ops Workspace",
    template: "%s | QA Daily Hub",
  },
  description: "A polished workspace for QA teams to manage test cases, execution, bugs, and daily activity.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  document.querySelectorAll('[bis_skin_checked]').forEach(function(el){
                    el.removeAttribute('bis_skin_checked');
                  });
                  new MutationObserver(function(mutations){
                    mutations.forEach(function(m){
                      if(m.type==='attributes'&&m.attributeName==='bis_skin_checked'){
                        m.target.removeAttribute('bis_skin_checked');
                      }
                    });
                  }).observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:['bis_skin_checked']});
                } catch(e){}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AppWrapper>
          {children}
        </AppWrapper>
        <Toaster />
      </body>
    </html>
  );
}
