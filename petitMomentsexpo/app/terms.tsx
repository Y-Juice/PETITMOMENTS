import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Brand } from "@/constants/theme";
import { FontFamily } from "@/constants/typography";
import { useThemeColor } from "@/hooks/use-theme-color";

/** Sjabloon — laat nakijken door een advocaat; geen juridisch advies. */
const SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. Partijen en aanvaarding",
    body: "Door een account aan te maken, in te loggen of de app te gebruiken, aanvaard je deze voorwaarden. Als je niet akkoord gaat, gebruik de app dan niet. Voor bepaalde functies kun je extra regels of toestemmingen moeten accepteren.",
  },
  {
    title: "2. De dienst",
    body: "Petit Moments is een digitale applicatie waarmee je onder meer foto-momenten kunt delen, bekijken en op een kaart kunt plaatsen, inclusief rode draden of gelijkaardige community-functies die in de app beschikbaar zijn. Functies kunnen wijzigen, worden toegevoegd of verwijderd. De dienst wordt aangeboden “zoals ze is” (as is), zonder garantie op ononderbroken beschikbaarheid of foutloze werking.",
  },
  {
    title: "3. Account en veiligheid",
    body: "Je bent verantwoordelijk voor de juistheid van je gegevens en voor het vertrouwelijk houden van je inloggegevens. Meld verdacht gebruik onmiddellijk. Wij mogen je account opschorten of beëindigen bij vermoeden van misbruik, fraude of grove schending van deze voorwaarden of van toepasselijk recht.",
  },
  {
    title: "4. Jouw inhoud",
    body: "Je behoudt de rechten op content die je uploadt. Je verleent ons een beperkte, wereldwijde, royaltyvrije licentie om die content te hosten, te verwerken, weer te geven en te distribueren voor zover nodig om de dienst te leveren en te verbeteren (o.a. opslag, back-ups, weergave aan andere gebruikers). Je verklaart dat je over de nodige rechten beschikt en dat je content geen rechten van derden schendt.",
  },
  {
    title: "5. Verboden gedrag",
    body: "Het is verboden om: onwettige, haatdragende, gewelddadige, obscene of misliedende content te plaatsen; anderen te stalken of lastig te vallen; persoonsgegevens van anderen zonder grondslag te verwerken; de app of onderliggende systemen te hacken, te reverse-engineeren waar verboden, of beveiliging te omzeilen; spam of malware te verspreiden; of de dienst te gebruiken op een manier die schade kan berokkenen aan gebruikers, ons of derden.",
  },
  {
    title: "6. Intellectuele eigendom",
    body: "Het merk, logo, ontwerp, broncode (voor zover niet open-source), documentatie en overige materialen van de app kunnen beschermd zijn door intellectuele eigendomsrechten. Behalve uitdrukkelijk toegestaan in deze voorwaarden of bij wet krijg je geen licentie op die materialen.",
  },
  {
    title: "7. Externe diensten",
    body: "De app kan gebruikmaken van externe aanbieders (bijv. hosting, kaarten, authenticatie). Hun voorwaarden en privacybeleid kunnen meespelen. Wij zijn niet aansprakelijk voor storingen bij die derden.",
  },
  {
    title: "8. Aansprakelijkheid (beperking)",
    body: "Voor zover wettelijk toegestaan: (a) onze totale aansprakelijkheid voor directe schade is beperkt tot het bedrag dat je ons in de twaalf maanden vóór het incident hebt betaald voor de dienst, of — als dat hoger is — honderd (100) euro; (b) wij zijn niet aansprakelijk voor indirecte schade, gevolgschade, winstderving, dataverlies of gemiste kansen; (c) dit geldt tenzij er sprake is van opzet of grove schuld voor zover dwingend recht dit niet uitsluit.",
  },
  {
    title: "9. Vrijwaring",
    body: "Je vrijwaart ons (en onze medewerkers en partners) tegen claims, schade en kosten (inclusief redelijke advocatenkosten) die voortkomen uit jouw gebruik van de app, jouw content of jouw schending van deze voorwaarden of van rechten van derden.",
  },
  {
    title: "10. Duur en beëindiging",
    body: "Je mag je account op elk moment stopzetten via de app of door ons te contacteren. Wij mogen de dienst of je toegang beëindigen met redelijke termijn waar mogelijk, tenzij acuut noodzakelijk. Na beëindiging kunnen bepaalde gegevens volgens ons bewaarbeleid en wettelijke verplichtingen bewaard blijven.",
  },
  {
    title: "11. Wijzigingen",
    body: "Wij kunnen deze voorwaarden updaten. Bij belangrijke wijzigingen streven we ernaar je te informeren (bijv. via de app). Verder gebruik na kennisgeving betekent dat je de nieuwe versie aanvaardt, tenzij je het eenrichtingsverkeer niet aanvaardt en stopt met gebruiken binnen de wettelijke termijn.",
  },
  {
    title: "12. Toepasselijk recht en geschillen",
    body: "Tenzij dwingend consumentenrecht anders voorschrijft, zijn op deze voorwaarden het Belgische recht van toepassing (invullen indien andere jurisdictie gewenst). Geschillen worden voorgelegd aan de bevoegde rechtbanken van de zetel die de exploitant kiest — tenzij je als consument profiteert van dwingend lokaal recht.",
  },
  {
    title: "13. Contact",
    body: "Voor vragen over deze voorwaarden: neem contact op via het supportkanaal of e-mailadres dat de exploitant van Petit Moments publiceert (aan te vullen).",
  },
];

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const muted = useThemeColor({}, "icon");

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Text style={[styles.backLabel, { color: Brand.primary }]}>
            ← Terug
          </Text>
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.docTitle, { color: textColor }]}>
          Algemene voorwaarden
        </Text>
        <Text style={[styles.updated, { color: muted }]}>
          Laatst bijgewerkt: mei 2026
        </Text>

        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.block}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {s.title}
            </Text>
            <Text style={[styles.sectionBody, { color: textColor }]}>
              {s.body}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  backLabel: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    fontWeight: "600",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  docTitle: {
    fontFamily: FontFamily.titleBold,
    fontSize: 24,
    marginBottom: 6,
  },
  updated: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    marginBottom: 20,
  },
  block: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: FontFamily.titleBold,
    fontSize: 17,
    marginBottom: 8,
  },
  sectionBody: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.95,
  },
});
