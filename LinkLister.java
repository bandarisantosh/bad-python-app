package com.ssrf;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import java.util.ArrayList;
import java.util.List;
import java.io.IOException;
import java.net.*;

public class LinkLister {

  private static final List<String> ALLOWED_SCHEMES = List.of("http", "https");

  private static void validateUrl(String url) throws IOException {
    URI uri;
    try {
      uri = new URI(url);
    } catch (URISyntaxException e) {
      throw new IOException("Invalid URL: " + e.getMessage());
    }

    String scheme = uri.getScheme();
    if (scheme == null || !ALLOWED_SCHEMES.contains(scheme.toLowerCase())) {
      throw new IOException("Only http and https schemes are allowed");
    }

    String host = uri.getHost();
    if (host == null || host.isEmpty()) {
      throw new IOException("URL must contain a valid host");
    }

    InetAddress resolved = InetAddress.getByName(host);
    if (resolved.isLoopbackAddress()
        || resolved.isSiteLocalAddress()
        || resolved.isLinkLocalAddress()
        || resolved.isAnyLocalAddress()) {
      throw new IOException("Requests to internal addresses are not allowed");
    }
  }

  public static List<String> getLinks(String url) throws IOException {
    validateUrl(url);

    List<String> result = new ArrayList<String>();
    Document doc = Jsoup.connect(url).get();
    Elements links = doc.select("a");
    for (Element link : links) {
      result.add(link.absUrl("href"));
    }
    return result;
  }

  public static List<String> getLinksV2(String url) throws BadRequest {
    try {
      return getLinks(url);
    } catch (IOException e) {
      throw new BadRequest(e.getMessage());
    }
  }
}
