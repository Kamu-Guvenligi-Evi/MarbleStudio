try {
  const response=await fetch('/catalog/manifest.json');if(!response.ok)throw new Error('Kaynak listesi okunamadı.');
  const catalog=await response.json();document.querySelector('#status').textContent=`${catalog.items.length} görselin kaynak kaydı`;
  for(const item of catalog.items) {
    const article=document.createElement('article'),img=document.createElement('img'),copy=document.createElement('div'),title=document.createElement('h2'),credit=document.createElement('p'),link=document.createElement('a');
    img.src=item.src;img.alt='';img.loading='lazy';title.textContent=item.name;credit.className='credit';credit.textContent=`${item.credit} · ${item.license}`;
    link.href=item.source;link.textContent='Orijinal dosya ve kullanım koşulları ↗';link.target='_blank';link.rel='noopener';copy.append(title,credit,link);
    if(item.licenseUrl?.startsWith('https://')) {const license=document.createElement('a');license.href=item.licenseUrl;license.textContent=' · Lisans metni';license.target='_blank';license.rel='noopener';copy.append(license);}
    article.append(img,copy);document.querySelector('#credits').append(article);
  }
}catch(error){document.querySelector('#status').textContent=error.message;}
