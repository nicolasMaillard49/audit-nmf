$node = (Get-Command node).Source
$script = 'D:\projets\scrapProsp\scripts\audit-keywords.mjs'
$seeds = 'menuisier sur mesure,menuisier agenceur,agencement intérieur,aménagement intérieur,mobilier sur mesure,dressing sur mesure,placard sur mesure,bibliothèque sur mesure,meuble sur mesure,cuisine sur mesure,bureau sur mesure,rangement sur mesure'
$portfolio = 'menuisier sur mesure,menuisier meuble sur mesure,menuisier agenceur,menuisier agencement intérieur,menuisier intérieur,menuisier Seine et Marne,menuiserie sur mesure,menuiserie intérieure sur mesure,agenceur intérieur,agenceur sur mesure,agenceur Seine et Marne,agencement intérieur,agencement intérieur sur mesure,aménagement intérieur,aménagement intérieur sur mesure,mobilier sur mesure,fabrication mobilier sur mesure,fabrication meuble sur mesure,création meuble sur mesure,conception meuble sur mesure,meuble sur mesure,meuble bois sur mesure,meuble rangement sur mesure,meuble entrée sur mesure,meuble salon sur mesure,meuble TV sur mesure,meuble bibliothèque sur mesure,bibliothèque sur mesure,bibliothèque murale sur mesure,bibliothèque bois sur mesure,dressing sur mesure,dressing personnalisé,création dressing,conception dressing,aménagement dressing,dressing sous pente,dressing d angle sur mesure,placard sur mesure,placard coulissant sur mesure,placard sous pente,placard sous escalier sur mesure,aménagement placard sur mesure,rangement sur mesure,rangement sous pente,meuble sous pente sur mesure,meuble sous escalier sur mesure,cuisine sur mesure,cuisine équipée sur mesure,meuble cuisine sur mesure,îlot cuisine sur mesure,bureau sur mesure,aménagement bureau sur mesure,table sur mesure,table bois sur mesure,table à manger sur mesure,claustra bois sur mesure,claustra sur mesure,agencement escalier,rangement sous escalier,devis menuisier sur mesure,devis agencement intérieur,devis meuble sur mesure,devis dressing sur mesure,devis bibliothèque sur mesure,devis placard sur mesure,devis cuisine sur mesure,devis bureau sur mesure,prix meuble sur mesure,prix dressing sur mesure,prix bibliothèque sur mesure,prix placard sur mesure,prix cuisine sur mesure,prix bureau sur mesure,tarif menuisier sur mesure,fabricant meuble sur mesure,artisan meuble sur mesure,artisan menuisier sur mesure,ébéniste meuble sur mesure,ébéniste sur mesure,fabricant dressing sur mesure,fabricant placard sur mesure,fabricant bibliothèque sur mesure,menuisier dressing,menuisier placard,menuisier bibliothèque,menuisier cuisine sur mesure,artisan agencement intérieur,aménagement sur mesure,meuble intégré sur mesure,mobilier intégré sur mesure'
$output = 'D:\projets\totowood audit\tmp\forecast-totowood-77-expanded-20260728.json'

& $node $script `
  --ville 'Seine-et-Marne' `
  --seeds $seeds `
  --forecast-keywords $portfolio `
  --budgets '50,100,150,200,300,500,750,1000,1500,2000' `
  --force-all-budgets `
  --output $output

exit $LASTEXITCODE
